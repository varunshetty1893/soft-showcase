// components/projects/ProjectGallery.tsx
"use client";

import * as React from "react";
import Image from "next/image";

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
      <div className="w-full aspect-video rounded-2xl bg-[#F8FAFA] border border-[#D9E2E4] flex flex-col items-center justify-center p-8 text-center">
        <span className="text-xl font-bold text-[#155761] mb-2">Soft Showcase</span>
        <span className="text-sm font-medium text-[#102124]">{projectTitle}</span>
        <span className="text-xs text-[#526267] mt-1">No screenshots uploaded yet</span>
      </div>
    );
  }

  const currentImage = images[selectedIdx] || images[0];

  return (
    <div className="space-y-4">
      {/* Primary Hero Image View */}
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-[#D9E2E4] bg-[#102124] shadow-xs">
        <Image
          src={currentImage.url}
          alt={currentImage.altText || `${projectTitle} screenshot ${selectedIdx + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 800px"
          unoptimized={currentImage.url.startsWith("data:")}
          referrerPolicy="no-referrer"
          className="object-contain"
        />
        {currentImage.caption && (
          <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-white p-3 text-xs z-10">
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
                  ? "border-[#155761] ring-2 ring-[#155761]/20 scale-102"
                  : "border-[#D9E2E4] opacity-70 hover:opacity-100 hover:border-[#155761]/40"
              }`}
            >
              <Image
                src={img.url}
                alt={img.altText || `${projectTitle} preview thumbnail ${idx + 1}`}
                fill
                sizes="96px"
                unoptimized={img.url.startsWith("data:")}
                referrerPolicy="no-referrer"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
