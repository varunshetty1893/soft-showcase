// app/api/admin/projects/[id]/images/reorder/route.ts
// Admin API endpoint for batch reordering project images.
// Source of truth: docs/24-image-storage.md

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const imageIds = body.imageIds;
    if (!Array.isArray(imageIds)) {
      return NextResponse.json({ error: "imageIds array is required" }, { status: 400 });
    }

    // Update sortOrder for each image in a transaction
    await db.$transaction(
      imageIds.map((imgId: string, index: number) =>
        db.projectImage.update({
          where: { id: imgId, projectId: id },
          data: { sortOrder: index },
        })
      )
    );

    // Revalidate public catalog, homepage, and project details (Issue 54)
    revalidatePath("/");
    revalidatePath("/projects");
    const proj = await db.project.findUnique({ where: { id }, select: { slug: true } });
    if (proj?.slug) revalidatePath(`/projects/${proj.slug}`);

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
