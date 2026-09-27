// components/admin/ImageUploader.tsx
// Drag-and-drop screenshot uploader with primary toggle, alt-text edit, and reordering.
// Source of truth: docs/24-image-storage.md

"use client";

import * as React from "react";
import {
  UploadCloud,
  Star,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Check,
  Edit2,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGE_SIZE_MB,
  MAX_IMAGES_PER_PROJECT,
} from "@/config/constants";

export interface ProjectImageItem {
  id: string;
  url: string;
  storageKey: string;
  altText?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface ImageUploaderProps {
  projectId: string;
  initialImages?: ProjectImageItem[];
  onImagesChange?: (images: ProjectImageItem[]) => void;
}

export function ImageUploader({
  projectId,
  initialImages = [],
  onImagesChange,
}: ImageUploaderProps) {
  const [images, setImages] = React.useState<ProjectImageItem[]>(initialImages);
  const [uploading, setUploading] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [editingAltId, setEditingAltId] = React.useState<string | null>(null);
  const [altTextDraft, setAltTextDraft] = React.useState<string>("");
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync state if initialImages prop updates
  React.useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  function notifyChange(newImages: ProjectImageItem[]) {
    setImages(newImages);
    if (onImagesChange) {
      onImagesChange(newImages);
    }
  }

  // Client-side file validation
  function validateFile(file: File): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return `Invalid format (${file.type}). Allowed: JPG, PNG, WebP.`;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds ${MAX_IMAGE_SIZE_MB}MB limit.`;
    }
    return null;
  }

  // Upload handler
  async function handleFilesUpload(files: FileList | File[]) {
    if (!files || files.length === 0) return;
    setErrorMessage(null);

    const availableSlots = MAX_IMAGES_PER_PROJECT - images.length;
    if (availableSlots <= 0) {
      setErrorMessage(`Maximum of ${MAX_IMAGES_PER_PROJECT} images allowed per project.`);
      return;
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots);
    setUploading(true);

    try {
      const uploadedImages: ProjectImageItem[] = [...images];

      for (const file of filesToUpload) {
        const validationError = validateFile(file);
        if (validationError) {
          setErrorMessage(validationError);
          continue;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("projectId", projectId);
        formData.append("isPrimary", String(uploadedImages.length === 0));

        const res = await fetch("/api/admin/uploads", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setErrorMessage(data.error || "Failed to upload image");
        } else if (data.data) {
          uploadedImages.push(data.data);
        }
      }

      notifyChange(uploadedImages);
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMessage("Network error occurred during image upload.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  // Drag and drop events
  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  }

  // Set primary image
  async function handleSetPrimary(imageId: string) {
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPrimary: true }),
      });

      if (!res.ok) {
        setErrorMessage("Failed to update primary image.");
        return;
      }

      const updated = images.map((img) => ({
        ...img,
        isPrimary: img.id === imageId,
      }));
      notifyChange(updated);
    } catch (err) {
      console.error("Primary image update error:", err);
      setErrorMessage("Network error setting primary image.");
    }
  }

  // Save alt text
  async function handleSaveAlt(imageId: string) {
    try {
      const res = await fetch(`/api/admin/projects/${projectId}/images/${imageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ altText: altTextDraft }),
      });

      if (!res.ok) {
        setErrorMessage("Failed to save alt text.");
        return;
      }

      const updated = images.map((img) =>
        img.id === imageId ? { ...img, altText: altTextDraft.trim() || null } : img
      );
      notifyChange(updated);
      setEditingAltId(null);
    } catch (err) {
      console.error("Alt text update error:", err);
      setErrorMessage("Network error saving alt text.");
    }
  }

  // Delete image
  async function handleDelete(imageId: string) {
    if (!confirm("Are you sure you want to delete this screenshot?")) return;

    try {
      const res = await fetch(`/api/admin/projects/${projectId}/images/${imageId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        setErrorMessage("Failed to delete image.");
        return;
      }

      let updated = images.filter((img) => img.id !== imageId);
      // If deleted image was primary and there are remaining images, set first as primary
      if (images.find((img) => img.id === imageId)?.isPrimary && updated.length > 0) {
        updated = updated.map((img, idx) => ({ ...img, isPrimary: idx === 0 }));
      }
      notifyChange(updated);
    } catch (err) {
      console.error("Image deletion error:", err);
      setErrorMessage("Network error deleting image.");
    }
  }

  // Reorder images
  async function handleMove(index: number, direction: "left" | "right") {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const updated = reordered.map((img, idx) => ({ ...img, sortOrder: idx }));
    notifyChange(updated);

    // Persist new order to server
    try {
      await fetch(`/api/admin/projects/${projectId}/images/reorder`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds: updated.map((img) => img.id) }),
      });
    } catch (err) {
      console.error("Reorder sync error:", err);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            Project Screenshots
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Upload screenshots for the catalog gallery. Star one image as the primary cover.
          </p>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded bg-gray-100 text-gray-700">
          {images.length} / {MAX_IMAGES_PER_PROJECT} images
        </span>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      {images.length < MAX_IMAGES_PER_PROJECT && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            dragActive
              ? "border-indigo-600 bg-indigo-50/50"
              : "border-gray-300 hover:border-indigo-400 bg-gray-50/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFilesUpload(e.target.files);
            }}
            disabled={uploading}
          />
          <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-gray-700">
            {uploading ? "Uploading to Cloudinary..." : "Click or drag & drop screenshots here"}
          </p>
          <p className="text-[11px] text-gray-400 mt-1">
            JPG, PNG, WebP up to {MAX_IMAGE_SIZE_MB}MB each. Maximum {MAX_IMAGES_PER_PROJECT} images.
          </p>
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={`relative bg-white border rounded-xl overflow-hidden shadow-xs group transition-all ${
                img.isPrimary ? "border-indigo-600 ring-2 ring-indigo-600/20" : "border-gray-200"
              }`}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-100 overflow-hidden">
                <img
                  src={img.url}
                  alt={img.altText || "Project screenshot"}
                  className="w-full h-full object-cover"
                />

                {/* Primary Badge */}
                {img.isPrimary && (
                  <div className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> Primary Cover
                  </div>
                )}

                {/* Action Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  {/* Reorder Left */}
                  {idx > 0 && (
                    <button
                      type="button"
                      title="Move earlier"
                      onClick={() => handleMove(idx, "left")}
                      className="p-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-lg shadow-sm transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}

                  {/* Make Primary */}
                  {!img.isPrimary && (
                    <button
                      type="button"
                      title="Set as Primary Cover"
                      onClick={() => handleSetPrimary(img.id)}
                      className="p-1.5 bg-white/90 hover:bg-white text-amber-600 rounded-lg shadow-sm transition"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}

                  {/* Reorder Right */}
                  {idx < images.length - 1 && (
                    <button
                      type="button"
                      title="Move later"
                      onClick={() => handleMove(idx, "right")}
                      className="p-1.5 bg-white/90 hover:bg-white text-gray-800 rounded-lg shadow-sm transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    type="button"
                    title="Delete image"
                    onClick={() => handleDelete(img.id)}
                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Alt Text Box */}
              <div className="p-3 bg-white text-xs border-t border-gray-100">
                {editingAltId === img.id ? (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="text"
                      value={altTextDraft}
                      onChange={(e) => setAltTextDraft(e.target.value)}
                      placeholder="Screenshot description..."
                      className="h-7 text-xs"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={() => handleSaveAlt(img.id)}
                      className="h-7 px-2"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="truncate pr-2 italic text-gray-500">
                      {img.altText || "No alt text set"}
                    </span>
                    <button
                      type="button"
                      title="Edit alt text"
                      onClick={() => {
                        setEditingAltId(img.id);
                        setAltTextDraft(img.altText || "");
                      }}
                      className="text-gray-400 hover:text-indigo-600 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
