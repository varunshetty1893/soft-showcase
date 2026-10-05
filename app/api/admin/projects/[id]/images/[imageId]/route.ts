// app/api/admin/projects/[id]/images/[imageId]/route.ts
// Admin API endpoint for updating and deleting individual project images.
// Source of truth: docs/24-image-storage.md & docs/15-api-architecture.md

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import { deleteImage } from "@/lib/storage/storage-service";

type Params = { params: Promise<{ id: string; imageId: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id, imageId } = await params;

    const image = await db.projectImage.findUnique({
      where: { id: imageId, projectId: id },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // 1. Delete from remote storage CDN
    await deleteImage(image.storageKey);

    // 2. Delete database record
    await db.projectImage.delete({
      where: { id: image.id },
    });

    // 3. If deleted image was primary, promote the first remaining image to primary
    if (image.isPrimary) {
      const nextImage = await db.projectImage.findFirst({
        where: { projectId: id },
        orderBy: { sortOrder: "asc" },
      });

      if (nextImage) {
        await db.$transaction([
          db.projectImage.updateMany({
            where: { projectId: id },
            data: { isPrimary: false },
          }),
          db.projectImage.update({
            where: { id: nextImage.id },
            data: { isPrimary: true },
          }),
        ]);
      }
    }

    // Revalidate public catalog, homepage, and project details (Issue 54)
    revalidatePath("/");
    revalidatePath("/projects");
    const proj = await db.project.findUnique({ where: { id }, select: { slug: true } });
    if (proj?.slug) revalidatePath(`/projects/${proj.slug}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("DELETE image error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}

const ImageUpdateSchema = z
  .object({
    altText: z.string().max(300, "Alt text must be under 300 characters").nullable().optional(),
    isPrimary: z.boolean().optional(),
    sortOrder: z.number().int("sortOrder must be a whole number").min(0).max(10000).optional(),
  })
  .strict();

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id, imageId } = await params;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Clear 400 instead of letting a bad value (e.g. non-numeric sortOrder -> NaN) hit Prisma.
    const parsed = ImageUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const input = parsed.data;

    const image = await db.projectImage.findUnique({
      where: { id: imageId, projectId: id },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const updated = await db.$transaction(async (tx) => {
      if (input.isPrimary === true) {
        // Unset primary flag on the other project images (atomic with the update below)
        await tx.projectImage.updateMany({
          where: { projectId: id, id: { not: imageId } },
          data: { isPrimary: false },
        });
      }

      return tx.projectImage.update({
        where: { id: imageId },
        data: {
          ...(input.altText !== undefined && { altText: input.altText?.trim() || null }),
          ...(input.isPrimary !== undefined && { isPrimary: input.isPrimary }),
          ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
        },
      });
    });

    // Revalidate public catalog, homepage, and project details (Issue 54)
    revalidatePath("/");
    revalidatePath("/projects");
    const proj = await db.project.findUnique({ where: { id }, select: { slug: true } });
    if (proj?.slug) revalidatePath(`/projects/${proj.slug}`);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("PATCH image error:", error);
    return NextResponse.json(
      { error: "Failed to update image" },
      { status: 500 }
    );
  }
}
