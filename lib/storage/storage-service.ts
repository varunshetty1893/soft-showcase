// lib/storage/storage-service.ts
// Abstract storage service for project screenshot management.
// Source of truth: docs/24-image-storage.md & docs/27-security.md

import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_MB,
} from "@/config/constants";
import {
  CloudinaryStorageProvider,
  StorageProvider,
  UploadResult,
  DeleteResult,
} from "./providers/cloudinary";

export type { UploadResult, DeleteResult };

/**
 * Detects the real MIME type of an image by inspecting its file magic bytes.
 * Supported formats: JPEG (FF D8 FF), PNG (89 50 4E 47), WebP (RIFF....WEBP).
 */
export function detectImageMagicBytes(buffer: Buffer | Uint8Array): string | null {
  if (!buffer || buffer.length < 4) return null;

  // JPEG / JPG: Starts with FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: Starts with 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: RIFF....WEBP (bytes 0-3 "RIFF", bytes 8-11 "WEBP")
  if (buffer.length >= 12) {
    const riff = String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3]);
    const webp = String.fromCharCode(buffer[8], buffer[9], buffer[10], buffer[11]);
    if (riff === "RIFF" && webp === "WEBP") {
      return "image/webp";
    }
  }

  return null;
}

/**
 * Validates uploaded file type, extension, size, and real file magic bytes.
 * Throws an Error with a user-friendly message on validation failure.
 */
export async function validateImageFile(file: {
  type?: string;
  size?: number;
  name?: string;
  arrayBuffer?: () => Promise<ArrayBuffer>;
  slice?: (start?: number, end?: number) => Blob;
} | Buffer): Promise<{ mimeType: string }> {
  if (!file) {
    throw new Error("No file provided for upload.");
  }

  const isBuf = Buffer.isBuffer(file);
  const size = isBuf ? (file as Buffer).length : (file.size ?? 0);

  // Check file size
  if (size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      `File size (${(size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of ${MAX_IMAGE_SIZE_MB}MB.`
    );
  }

  // Check declared MIME type if specified
  const declaredType = !isBuf && "type" in file && file.type ? file.type : undefined;
  if (declaredType && !ALLOWED_IMAGE_TYPES.includes(declaredType)) {
    throw new Error(
      `Invalid declared file type (${declaredType}). Allowed formats: JPEG, PNG, WebP.`
    );
  }

  // Check file extension if name is available
  if (!isBuf && "name" in file && file.name) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExts = ["jpg", "jpeg", "png", "webp"];
    if (!ext || !allowedExts.includes(ext)) {
      throw new Error(`File extension .${ext} is not allowed.`);
    }
  }

  // ── Magic Bytes Validation ────────────────────────────────────────────────
  // Read first 32 bytes to determine actual file signature
  let headerBuffer: Buffer;
  if (isBuf) {
    const b = file as Buffer;
    headerBuffer = Buffer.from(b.buffer, b.byteOffset, Math.min(b.byteLength, 32));
  } else if (typeof (file as any).slice === "function") {
    const sliceBlob = (file as any).slice(0, 32);
    if (sliceBlob && typeof sliceBlob.arrayBuffer === "function") {
      const ab = await sliceBlob.arrayBuffer();
      headerBuffer = Buffer.from(ab);
    } else if (typeof (file as any).arrayBuffer === "function") {
      const ab = await (file as any).arrayBuffer();
      headerBuffer = Buffer.from(ab.slice(0, 32));
    } else {
      return { mimeType: declaredType || "image/jpeg" };
    }
  } else if (typeof (file as any).arrayBuffer === "function") {
    const ab = await (file as any).arrayBuffer();
    headerBuffer = Buffer.from(ab.slice(0, 32));
  } else {
    // Fallback if no binary method available
    return { mimeType: declaredType || "image/jpeg" };
  }

  const detectedMime = detectImageMagicBytes(headerBuffer);
  if (!detectedMime) {
    throw new Error(
      "Invalid file content: The uploaded file is not a valid JPEG, PNG, or WebP image."
    );
  }

  if (!ALLOWED_IMAGE_TYPES.includes(detectedMime)) {
    throw new Error(
      `Unsupported image format detected (${detectedMime}). Allowed formats: JPEG, PNG, WebP.`
    );
  }

  // Verify that declared type does not contradict detected magic bytes
  if (declaredType && declaredType !== "application/octet-stream") {
    const isJpegFamily = (t: string) => t === "image/jpeg" || t === "image/jpg";
    const matches =
      declaredType === detectedMime ||
      (isJpegFamily(declaredType) && isJpegFamily(detectedMime));

    if (!matches) {
      throw new Error(
        `File content mismatch: Declared type is ${declaredType}, but file content is ${detectedMime}.`
      );
    }
  }

  return { mimeType: detectedMime };
}

/**
 * Factory to instantiate the configured storage service provider.
 */
export function createStorageService(): StorageProvider {
  const provider = (process.env.STORAGE_PROVIDER || "cloudinary").toLowerCase();

  switch (provider) {
    case "cloudinary":
      return new CloudinaryStorageProvider();
    default:
      console.warn(`[Storage] Unknown provider "${provider}". Defaulting to Cloudinary.`);
      return new CloudinaryStorageProvider();
  }
}

/**
 * Main upload helper function.
 */
export async function uploadImage(
  file: File | Blob | Buffer,
  folder: string = "soft-showcase/projects"
): Promise<UploadResult> {
  const service = createStorageService();
  return service.upload(file, { folder });
}

/**
 * Main deletion helper function.
 */
export async function deleteImage(storageKey: string): Promise<DeleteResult> {
  const service = createStorageService();
  return service.delete(storageKey);
}
