// lib/storage/providers/cloudinary.ts
// Cloudinary storage implementation using direct HTTPS REST API.
// Source of truth: docs/24-image-storage.md

import crypto from "crypto";

export interface UploadOptions {
  folder?: string;
  publicId?: string;
}

export interface UploadResult {
  url: string;
  storageKey: string; // Cloudinary public_id
  width?: number;
  height?: number;
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

export interface StorageProvider {
  upload(file: File | Blob | Buffer, options?: UploadOptions): Promise<UploadResult>;
  delete(storageKey: string): Promise<DeleteResult>;
}

export class CloudinaryStorageProvider implements StorageProvider {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";
    this.apiKey = process.env.CLOUDINARY_API_KEY || "";
    this.apiSecret = process.env.CLOUDINARY_API_SECRET || "";
  }

  /**
   * Upload an image to Cloudinary via HTTPS REST API.
   */
  async upload(file: File | Blob | Buffer, options: UploadOptions = {}): Promise<UploadResult> {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      console.warn(
        "[Storage:Cloudinary] Cloudinary credentials not configured. Returning simulated mock asset for development."
      );
      const mockId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      return {
        url: `https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80`,
        storageKey: mockId,
      };
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = options.folder || "soft-showcase/projects";

    // Generate SHA-1 signature
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    };
    if (options.publicId) {
      paramsToSign.public_id = options.publicId;
    }

    const sortedQuery = Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join("&");

    const signature = crypto
      .createHash("sha1")
      .update(sortedQuery + this.apiSecret)
      .digest("hex");

    const formData = new FormData();
    if (file instanceof Buffer) {
      const arrayBuffer = file.buffer.slice(
        file.byteOffset,
        file.byteOffset + file.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([arrayBuffer]);
      formData.append("file", blob, "image.jpg");
    } else {
      formData.append("file", file as Blob);
    }

    formData.append("api_key", this.apiKey);
    formData.append("timestamp", String(timestamp));
    formData.append("folder", folder);
    formData.append("signature", signature);
    if (options.publicId) {
      formData.append("public_id", options.publicId);
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data?.error?.message || `HTTP ${response.status}: Cloudinary upload failed`;
      console.error("[Storage:Cloudinary] Upload error:", errorMsg);
      throw new Error(errorMsg);
    }

    return {
      url: data.secure_url,
      storageKey: data.public_id,
      width: data.width,
      height: data.height,
    };
  }

  /**
   * Delete an image from Cloudinary using its storageKey (public_id).
   */
  async delete(storageKey: string): Promise<DeleteResult> {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      console.warn(
        `[Storage:Cloudinary] Cloudinary credentials not configured. Simulated deletion of ${storageKey}.`
      );
      return { success: true };
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const stringToSign = `public_id=${storageKey}&timestamp=${timestamp}${this.apiSecret}`;
      const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

      const formData = new FormData();
      formData.append("public_id", storageKey);
      formData.append("api_key", this.apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);

      const deleteUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`;
      const response = await fetch(deleteUrl, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || data.result !== "ok") {
        const errorMsg = data?.error?.message || data?.result || "Failed to delete Cloudinary asset";
        console.warn(`[Storage:Cloudinary] Delete response warning:`, errorMsg);
        return { success: false, error: errorMsg };
      }

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error deleting image from Cloudinary";
      console.error("[Storage:Cloudinary] Delete exception:", errorMsg);
      return { success: false, error: errorMsg };
    }
  }
}
