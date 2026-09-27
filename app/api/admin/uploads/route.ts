// app/api/admin/uploads/route.ts
// Admin API endpoint for uploading project screenshots.
// Source of truth: docs/24-image-storage.md & docs/15-api-architecture.md

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import { validateImageFile, uploadImage } from "@/lib/storage/storage-service";
import { MAX_IMAGES_PER_PROJECT } from "@/config/constants";

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

    // 2. Validate image count
    const imageCount = await db.projectImage.count({
      where: { projectId },
    });

    if (imageCount >= MAX_IMAGES_PER_PROJECT) {
      return NextResponse.json(
        { error: `Maximum of ${MAX_IMAGES_PER_PROJECT} images allowed per project.` },
        { status: 400 }
      );
    }

    // 3. Validate image type and size
    try {
      validateImageFile(file);
    } catch (valErr) {
      return NextResponse.json(
        { error: valErr instanceof Error ? valErr.message : "Invalid image file" },
        { status: 400 }
      );
    }

    // 4. Upload to storage provider (Cloudinary)
    const result = await uploadImage(file, `soft-showcase/projects/${projectId}`);

    // If first image or marked primary, adjust primary flags
    if (imageCount === 0) {
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

    return NextResponse.json({ success: true, data: image }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("POST /api/admin/uploads error:", error);
    return NextResponse.json(
      { error: "Failed to upload image. Please try again." },
      { status: 500 }
    );
  }
}
