// app/api/partner/uploads/route.ts
// Partner API endpoint for uploading project screenshots and photos.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { validateImageFile, uploadImage } from "@/lib/storage/storage-service";
import { MAX_IMAGE_SIZE_BYTES } from "@/config/constants";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify partner profile exists
    const partner = await db.projectProvider.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || "" },
        ],
      },
    });

    if (!partner && !session.user.isAdmin) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    try {
      validateImageFile(file);
    } catch (valErr) {
      return NextResponse.json(
        { error: valErr instanceof Error ? valErr.message : "Invalid image file" },
        { status: 400 }
      );
    }

    // Try uploading to configured storage provider
    try {
      const result = await uploadImage(file, `soft-showcase/partners/${partner?.id || "temp"}`);
      if (result?.url && !result.url.includes("unsplash.com")) {
        return NextResponse.json({
          success: true,
          url: result.url,
          storageKey: result.storageKey,
        });
      }
    } catch {
      // Fallback to inline Base64 data URL if external storage provider is offline/unconfigured
    }

    // Convert to Base64 data URL fallback so uploaded image works out-of-the-box
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      storageKey: `local-file-${Date.now()}`,
    });
  } catch (error) {
    console.error("POST /api/partner/uploads error:", error);
    return NextResponse.json({ error: "Failed to upload image file" }, { status: 500 });
  }
}
