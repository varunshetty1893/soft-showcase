// components/projects/ProjectGallery.tsx
"use client";

import * as React from "react";

interface ProjectImage {
  id?: string;
  url: string;
  altText?: string | null;
  caption?: string | null;
  isPrimary?: boolean;
}

interface ProjectGalleryProps {
  images: ProjectImage[];
  projectTitle: string;
}

export function ProjectGallery({ images, projectTitle }: ProjectGalleryProps) {
  const [selectedIdx, setSelectedIdx] = React.useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-video rounded-2xl bg-gradient-to-br from-indigo-50/50 to-gray-100 border border-gray-200 flex flex-col items-center justify-center p-8 text-center">
        <span className="text-3xl font-black text-indigo-300 mb-2">11</span>
        <span className="text-sm font-medium text-gray-500">{projectTitle}</span>
        <span className="text-xs text-gray-400 mt-1">No screenshots uploaded yet</span>
      </div>
    );
  }

  const currentImage = images[selectedIdx] || images[0];

  return (
    <div className="space-y-4">
      {/* Primary Hero Image View */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 shadow-sm">
        <img
          src={currentImage.url}
          alt={currentImage.altText || `${projectTitle} screenshot ${selectedIdx + 1}`}
          className="w-full h-full object-contain"
        />
        {currentImage.caption && (
          <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-white p-3 text-xs">
            {currentImage.caption}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={img.id || idx}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`relative aspect-video w-24 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                selectedIdx === idx
                  ? "border-indigo-600 ring-2 ring-indigo-600/30 scale-102"
                  : "border-gray-200 opacity-70 hover:opacity-100 hover:border-gray-300"
              }`}
            >
              <img
                src={img.url}
                alt={img.altText || `Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
