// app/api/admin/uploads/route.ts
// Admin API endpoint for uploading project screenshots.
// Source of truth: docs/24-image-storage.md & docs/15-api-architecture.md
//
// Architecture note — "new project" uploads (no projectId):
//   Images uploaded before a project record exists are stored under
//   soft-showcase/projects/new and returned as a temporary { id, url, storageKey }
//   object. The caller (AdminProjectForm) must pass every storageKey back when the
//   project is finally created (POST /api/admin/projects) so the server can move
//   them into the project folder. Any storageKey that is never attached to a
//   project becomes an orphan; a periodic Cloudinary admin job (or a server-side
//   cleanup cron) is the appropriate remediation for that problem — it cannot be
//   solved at the HTTP layer because there is no reliable "cancel" event in a
//   stateless serverless environment.
//
// Architecture note — in-memory upload lock:
//   `projectUploadLocks` serialises concurrent uploads within a single Node
//   process instance. On Vercel each serverless invocation is isolated, so the
//   map does NOT coordinate across concurrent instances. The lock is kept because
//   it still eliminates races within one instance (local dev / single instance),
//   and the double-count-check after upload provides a last-resort guard that
//   detects over-limit uploads and triggers Cloudinary cleanup even when the lock
//   was bypassed.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import { validateImageFile, uploadImage, deleteImage } from "@/lib/storage/storage-service";
import { MAX_IMAGES_PER_PROJECT } from "@/config/constants";

// Mutex lock map to serialise concurrent uploads per project within a single
// Node process instance. See architecture note above for multi-instance caveats.
const projectUploadLocks = new Map<string, Promise<unknown>>();

async function withProjectLock<T>(projectId: string, fn: () => Promise<T>): Promise<T> {
  const currentLock = projectUploadLocks.get(projectId) || Promise.resolve();
  let release: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  projectUploadLocks.set(
    projectId,
    currentLock.then(() => nextLock)
  );

  await currentLock;
  try {
    return await fn();
  } finally {
    release!();
    if (projectUploadLocks.get(projectId) === nextLock) {
      projectUploadLocks.delete(projectId);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;
    const altText = (formData.get("altText") as string | null)?.trim() || null;
    const isPrimaryParam = formData.get("isPrimary");
    let isPrimary = isPrimaryParam === "true";

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Validate image type, size, and real file magic bytes before touching storage.
    try {
      await validateImageFile(file);
    } catch (valErr) {
      return NextResponse.json(
        { error: valErr instanceof Error ? valErr.message : "Invalid image file" },
        { status: 400 }
      );
    }

    // ── New-project upload (no projectId yet) ─────────────────────────────────
    // Upload to a staging folder and return a temporary descriptor. The caller is
    // responsible for submitting every storageKey when the project is created.
    // Orphaned images (project creation cancelled) must be cleaned up out-of-band.
    if (!projectId) {
      const result = await uploadImage(file, "soft-showcase/projects/new");
      return NextResponse.json(
        {
          success: true,
          data: {
            id: `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            url: result.url,
            storageKey: result.storageKey,
            altText,
            isPrimary,
            sortOrder: 0,
          },
        },
        { status: 201 }
      );
    }

    // ── Existing-project upload ───────────────────────────────────────────────

    // Verify project exists before locking and uploading.
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, slug: true, title: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Execute upload and database registration inside per-project lock to
    // eliminate within-instance race conditions on the image count check.
    return await withProjectLock(projectId, async () => {
      // Check count BEFORE uploading to avoid wasting storage quota.
      const imageCount = await db.projectImage.count({ where: { projectId } });

      if (imageCount >= MAX_IMAGES_PER_PROJECT) {
        return NextResponse.json(
          { error: `Maximum of ${MAX_IMAGES_PER_PROJECT} images allowed per project.` },
          { status: 400 }
        );
      }

      // Upload to remote storage.
      const result = await uploadImage(file, `soft-showcase/projects/${projectId}`);

      // Re-check count after upload in case a concurrent serverless instance
      // also uploaded between our first check and now. If the limit is exceeded,
      // delete the just-uploaded image from Cloudinary and return an error so
      // no orphan is left behind.
      const freshCount = await db.projectImage.count({ where: { projectId } });

      if (freshCount >= MAX_IMAGES_PER_PROJECT) {
        await deleteImage(result.storageKey).catch((e) =>
          console.error("[uploads] Cleanup of over-limit upload failed:", e)
        );
        return NextResponse.json(
          { error: `Maximum of ${MAX_IMAGES_PER_PROJECT} images reached.` },
          { status: 400 }
        );
      }

      // First image must always be primary.
      if (freshCount === 0) {
        isPrimary = true;
      }

      if (isPrimary) {
        await db.projectImage.updateMany({
          where: { projectId },
          data: { isPrimary: false },
        });
      }

      // Determine next sort order.
      const highestSort = await db.projectImage.findFirst({
        where: { projectId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      const sortOrder = (highestSort?.sortOrder ?? -1) + 1;

      // Persist image metadata.
      const image = await db.projectImage.create({
        data: {
          projectId,
          url: result.url,
          storageKey: result.storageKey,
          altText,
          isPrimary,
          sortOrder,
        },
      });

      // Revalidate public catalog, homepage, and project details.
      revalidatePath("/");
      revalidatePath("/projects");
      if (project.slug) revalidatePath(`/projects/${project.slug}`);

      return NextResponse.json({ success: true, data: image }, { status: 201 });
    });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("POST /api/admin/uploads error:", error);
    return NextResponse.json(
      { error: "Failed to upload image. Please try again." },
      { status: 500 }
    );
  }
}
