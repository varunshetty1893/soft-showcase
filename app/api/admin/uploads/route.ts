// app/api/admin/uploads/route.ts
// Admin API endpoint for uploading project screenshots.
// Source of truth: docs/24-image-storage.md & docs/15-api-architecture.md

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import { validateImageFile, uploadImage } from "@/lib/storage/storage-service";
import { MAX_IMAGES_PER_PROJECT } from "@/config/constants";

// Mutex lock map to serialize concurrent uploads per project (Issue 28: Image Upload Race Condition)
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

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // 1. Verify project exists
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true, title: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 2. Validate image type, size, and real file magic bytes
    try {
      await validateImageFile(file);
    } catch (valErr) {
      return NextResponse.json(
        { error: valErr instanceof Error ? valErr.message : "Invalid image file" },
        { status: 400 }
      );
    }

    // Execute upload and database registration inside per-project lock to eliminate race conditions
    return await withProjectLock(projectId, async () => {
      // 3. Atomically validate image count inside lock
      const imageCount = await db.projectImage.count({
        where: { projectId },
      });

      if (imageCount >= MAX_IMAGES_PER_PROJECT) {
        return NextResponse.json(
          { error: `Maximum of ${MAX_IMAGES_PER_PROJECT} images allowed per project.` },
          { status: 400 }
        );
      }

      // 4. Upload to storage provider (Cloudinary)
      const result = await uploadImage(file, `soft-showcase/projects/${projectId}`);

      // Double-check count after upload
      const freshCount = await db.projectImage.count({
        where: { projectId },
      });

      if (freshCount >= MAX_IMAGES_PER_PROJECT) {
        return NextResponse.json(
          { error: `Maximum of ${MAX_IMAGES_PER_PROJECT} images reached.` },
          { status: 400 }
        );
      }

      // If first image, enforce primary
      if (freshCount === 0) {
        isPrimary = true;
      }

      if (isPrimary) {
        await db.projectImage.updateMany({
          where: { projectId },
          data: { isPrimary: false },
        });
      }

      // Determine sort order
      const highestSort = await db.projectImage.findFirst({
        where: { projectId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      const sortOrder = (highestSort?.sortOrder ?? -1) + 1;

      // 5. Store image metadata in database
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

      // Revalidate project page and catalog caches (Issue 54)
      revalidatePath("/");
      revalidatePath("/projects");
      if (project.title) {
        const fullProj = await db.project.findUnique({ where: { id: projectId }, select: { slug: true } });
        if (fullProj?.slug) revalidatePath(`/projects/${fullProj.slug}`);
      }

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
