// app/api/partner/uploads/route.ts
// Partner API endpoint for uploading project screenshots and photos.
// Enforces real file magic bytes validation and uploads to Cloudinary storage.
// Does NOT allow or store base64 data URLs in the database.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { validateImageFile, uploadImage } from "@/lib/storage/storage-service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify partner profile exists strictly by userId (Issue 42)
    const partner = await db.projectProvider.findFirst({
      where: { userId: session.user.id },
    });

    if (!partner && !session.user.isAdmin) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Validate size, extension, MIME type, and real file magic bytes (Issue Task 4)
    try {
      await validateImageFile(file);
    } catch (valErr) {
      return NextResponse.json(
        { error: valErr instanceof Error ? valErr.message : "Invalid image file" },
        { status: 400 }
      );
    }

    // Upload to configured storage provider (Cloudinary).
    // If upload fails, return an error. Do NOT fall back to base64 data URLs.
    try {
      const result = await uploadImage(file, `soft-showcase/partners/${partner?.id || "temp"}`);
      return NextResponse.json({
        success: true,
        url: result.url,
        storageKey: result.storageKey,
      });
    } catch (uploadErr) {
      const message = uploadErr instanceof Error ? uploadErr.message : "Cloudinary upload failed";
      console.error("[Upload:Partner] Cloudinary upload failed:", message);
      return NextResponse.json(
        { error: `Image upload failed: ${message}. Cloudinary storage is currently unavailable.` },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("POST /api/partner/uploads error:", error);
    return NextResponse.json({ error: "Failed to upload image file" }, { status: 500 });
  }
}
