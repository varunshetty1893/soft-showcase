// app/api/admin/projects/[id]/images/[imageId]/route.ts
// Admin API endpoint for updating and deleting individual project images.
// Source of truth: docs/24-image-storage.md & docs/15-api-architecture.md

import { NextRequest, NextResponse } from "next/server";
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
        await db.projectImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }

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

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id, imageId } = await params;
    const body = await request.json();

    const image = await db.projectImage.findUnique({
      where: { id: imageId, projectId: id },
    });

    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    if (body.isPrimary === true) {
      // Unset primary flag on other project images
      await db.projectImage.updateMany({
        where: { projectId: id },
        data: { isPrimary: false },
      });
    }

    const updated = await db.projectImage.update({
      where: { id: imageId },
      data: {
        ...(body.altText !== undefined && {
          altText: typeof body.altText === "string" ? body.altText.trim() || null : null,
        }),
        ...(body.isPrimary !== undefined && { isPrimary: Boolean(body.isPrimary) }),
        ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) }),
      },
    });

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
