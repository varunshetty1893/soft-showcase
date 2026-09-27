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
 * Validates uploaded file type, extension, and file size.
 * Throws an Error with a user-friendly message on failure.
 */
export function validateImageFile(file: { type: string; size: number; name?: string }) {
  if (!file) {
    throw new Error("No file provided for upload.");
  }

  // Check MIME type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type (${file.type || "unknown"}). Allowed formats: JPEG, PNG, WebP.`
    );
  }

  // Check file extension if name is available
  if (file.name) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const allowedExts = ["jpg", "jpeg", "png", "webp"];
    if (!ext || !allowedExts.includes(ext)) {
      throw new Error(`File extension .${ext} is not allowed.`);
    }
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error(
      `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of ${MAX_IMAGE_SIZE_MB}MB.`
    );
  }
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
