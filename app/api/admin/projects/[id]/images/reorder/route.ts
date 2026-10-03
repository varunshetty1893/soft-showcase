// app/api/admin/projects/[id]/images/reorder/route.ts
// Admin API endpoint for batch reordering project images.
// Source of truth: docs/24-image-storage.md

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

const MAX_IMAGES = 100;

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => null);

    const imageIds: unknown = body?.imageIds;
    if (
      !Array.isArray(imageIds) ||
      imageIds.length === 0 ||
      imageIds.some((v) => typeof v !== "string" || !v.trim())
    ) {
      return NextResponse.json(
        { error: "imageIds must be a non-empty array of image ids" },
        { status: 400 }
      );
    }

    const ids = (imageIds as string[]).map((v) => v.trim());
    if (ids.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Too many images (max ${MAX_IMAGES})` },
        { status: 400 }
      );
    }

    // Duplicate ids would give two images the same slot / inconsistent ordering.
    if (new Set(ids).size !== ids.length) {
      return NextResponse.json(
        { error: "imageIds must not contain duplicates" },
        { status: 400 }
      );
    }

    const project = await db.project.findUnique({
      where: { id },
      select: { id: true, slug: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Every id must belong to this project; images not mentioned keep their relative
    // order and are placed after the listed ones, so sortOrder stays unique and contiguous.
    const existing = await db.projectImage.findMany({
      where: { projectId: id },
      select: { id: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    const existingIds = new Set(existing.map((img) => img.id));
    const unknown = ids.filter((imgId) => !existingIds.has(imgId));
    if (unknown.length > 0) {
      return NextResponse.json(
        { error: "Some images do not belong to this project", invalidImageIds: unknown },
        { status: 400 }
      );
    }

    const listed = new Set(ids);
    const finalOrder = [...ids, ...existing.map((img) => img.id).filter((imgId) => !listed.has(imgId))];

    await db.$transaction(
      finalOrder.map((imgId, index) =>
        db.projectImage.updateMany({
          where: { id: imgId, projectId: id },
          data: { sortOrder: index },
        })
      )
    );

    // Revalidate public catalog, homepage, and project details (Issue 54)
    revalidatePath("/");
    revalidatePath("/projects");
    if (project.slug) revalidatePath(`/projects/${project.slug}`);

    return NextResponse.json({ success: true, message: "Images reordered successfully" });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("PUT /api/admin/projects/[id]/images/reorder error:", error);
    return NextResponse.json(
      { error: "Failed to reorder images" },
      { status: 500 }
    );
  }
}
