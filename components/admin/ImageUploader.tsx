// components/admin/ImageUploader.tsx
// Drag-and-drop screenshot uploader with primary toggle, alt-text edit, and reordering.
// Source of truth: docs/24-image-storage.md

"use client";

import * as React from "react";
import Image from "next/image";
import {
  UploadCloud,
  Star,
  Trash2,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Info,
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

  // Reorder images (left/right by 1, up/down by row or step)
  async function handleMove(index: number, direction: "left" | "right" | "up" | "down") {
    let targetIndex = index;
    if (direction === "left") {
      targetIndex = index - 1;
    } else if (direction === "right") {
      targetIndex = index + 1;
    } else if (direction === "up") {
      // If in row 2 or beyond (index >= 3), jump 1 row up (index - 3), else move 1 step earlier
      targetIndex = index >= 3 ? index - 3 : index - 1;
    } else if (direction === "down") {
      // If an item exists 1 row below (index + 3 < length), jump 1 row down, else move 1 step later
      targetIndex = index + 3 < images.length ? index + 3 : index + 1;
    }

    if (targetIndex < 0 || targetIndex >= images.length || targetIndex === index) return;

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
          <h3 className="text-sm font-bold text-[#102124] flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#155761]" />
            Project Screenshots
          </h3>
          <p className="text-xs text-[#526267] mt-0.5">
            Upload screenshots for the catalog gallery. Star one image as the primary cover.
          </p>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761]">
          {images.length} / {MAX_IMAGES_PER_PROJECT} images
        </span>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Recommended Sizing Notice */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#DDF4EC]/60 border border-[#2F7D78]/25 text-xs text-[#155761]">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#2F7D78]" />
        <div>
          <span className="font-bold">Recommended Image Dimensions:</span>{" "}
          <span>
            <strong>1200 × 675 px</strong> (exact 16:9 aspect ratio) or <strong>1600 × 900 px</strong> (Retina). Standard 16:9 ratio ensures 100% of your interface fits perfectly in the showcase cards and lightbox without cropping. Max 5MB each (PNG, JPG, WebP).
          </span>
        </div>
      </div>

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
              ? "border-[#155761] bg-[#F3F7F7]"
              : "border-[#D9E2E4] hover:border-[#155761]/40 bg-[#F8FAFA]"
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
          <UploadCloud className="w-8 h-8 text-[#526267] mx-auto mb-2" />
          <p className="text-xs font-semibold text-[#102124]">
            {uploading ? "Uploading to Cloudinary..." : "Click or drag & drop screenshots here"}
          </p>
          <p className="text-[11px] text-[#526267] mt-1">
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
                img.isPrimary ? "border-[#155761] ring-2 ring-[#155761]/20" : "border-[#D9E2E4]"
              }`}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-[#F3F7F7] overflow-hidden">
                <Image
                  src={img.url}
                  alt={img.altText || "Project screenshot"}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  referrerPolicy="no-referrer"
                  unoptimized={img.url.startsWith("data:")}
                />

                {/* Primary Badge or Make Primary Button */}
                {img.isPrimary ? (
                  <div className="absolute top-2 left-2 bg-[#155761] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 z-10">
                    <Star className="w-3 h-3 fill-current text-amber-300" /> Primary Cover
                  </div>
                ) : (
                  <button
                    type="button"
                    title="Set as Primary Cover"
                    onClick={() => handleSetPrimary(img.id)}
                    className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 hover:bg-[#155761] text-white text-[10px] font-medium shadow-xs transition-colors flex items-center gap-1 backdrop-blur-xs cursor-pointer opacity-90 hover:opacity-100 z-10"
                  >
                    <Star className="w-3 h-3 text-amber-300" />
                    Make Primary
                  </button>
                )}

                {/* 4-Way Reorder Controls (Left, Up, Down, Right) */}
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-xs p-1 rounded-xl shadow-xs z-10">
                  {/* Move Left */}
                  {idx > 0 && (
                    <button
                      type="button"
                      title="Move 1 step left (←)"
                      onClick={() => handleMove(idx, "left")}
                      className="w-6 h-6 rounded-md hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Move Up */}
                  {idx > 0 && (
                    <button
                      type="button"
                      title="Move earlier / Up (↑)"
                      onClick={() => handleMove(idx, "up")}
                      className="w-6 h-6 rounded-md hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Move Down */}
                  {idx < images.length - 1 && (
                    <button
                      type="button"
                      title="Move later / Down (↓)"
                      onClick={() => handleMove(idx, "down")}
                      className="w-6 h-6 rounded-md hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Move Right */}
                  {idx < images.length - 1 && (
                    <button
                      type="button"
                      title="Move 1 step right (→)"
                      onClick={() => handleMove(idx, "right")}
                      className="w-6 h-6 rounded-md hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Alt Text Box & Actions */}
              <div className="p-3 bg-white text-xs border-t border-gray-100 space-y-2">
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
                      {img.altText || "No caption set"}
                    </span>
                    <button
                      type="button"
                      title="Edit alt text"
                      onClick={() => {
                        setEditingAltId(img.id);
                        setAltTextDraft(img.altText || "");
                      }}
                      className="text-[#526267] hover:text-[#155761] transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <span className="text-[11px] text-[#526267]">
                    {img.isPrimary ? "Cover Thumbnail" : `Photo #${idx + 1}`}
                  </span>
                  <button
                    type="button"
                    title="Delete image"
                    onClick={() => handleDelete(img.id)}
                    className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
