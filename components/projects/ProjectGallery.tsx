// components/projects/ProjectGallery.tsx
"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  X,
} from "lucide-react";

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

function isOptimizableImage(url?: string | null): boolean {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "res.cloudinary.com" ||
      parsed.hostname === "images.unsplash.com" ||
      parsed.hostname === "picsum.photos" ||
      parsed.hostname === "lh3.googleusercontent.com" ||
      parsed.hostname === "raw.githubusercontent.com" ||
      parsed.hostname === "avatars.githubusercontent.com"
    );
  } catch {
    return false;
  }
}

export function ProjectGallery({ images, projectTitle }: ProjectGalleryProps) {
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [isZoomed, setIsZoomed] = React.useState(false);
  const thumbStripRef = React.useRef<HTMLDivElement | null>(null);

  const total = images?.length || 0;

  // Navigation handlers
  const handlePrev = React.useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setSelectedIdx((prev) => (prev > 0 ? prev - 1 : total - 1));
      setIsZoomed(false);
    },
    [total]
  );

  const handleNext = React.useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setSelectedIdx((prev) => (prev < total - 1 ? prev + 1 : 0));
      setIsZoomed(false);
    },
    [total]
  );

  // Keyboard navigation when gallery / lightbox is active
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (isLightboxOpen) {
        if (e.key === "Escape") {
          setIsLightboxOpen(false);
          setIsZoomed(false);
        } else if (e.key === "ArrowLeft") {
          handlePrev();
        } else if (e.key === "ArrowRight") {
          handleNext();
        } else if (e.key === "z" || e.key === "Z" || e.key === "+") {
          setIsZoomed((z) => !z);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, handlePrev, handleNext]);

  // Lock body scroll when lightbox is open
  React.useEffect(() => {
    if (isLightboxOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isLightboxOpen]);

  // Smooth scroll thumbnail into view when active index changes
  React.useEffect(() => {
    if (thumbStripRef.current) {
      const activeEl = thumbStripRef.current.querySelector(
        `[data-thumb-index="${selectedIdx}"]`
      );
      if (activeEl && typeof activeEl.scrollIntoView === "function") {
        activeEl.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedIdx]);

  // Scroll thumbnail strip manually using arrows
  const scrollThumbnails = (direction: "left" | "right") => {
    if (thumbStripRef.current) {
      const offset = direction === "left" ? -240 : 240;
      thumbStripRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

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
    <div className="space-y-3">
      {/* ── 1. Primary Hero Display Card ────────────────────────────────────── */}
      <div className="relative isolate aspect-video w-full rounded-2xl overflow-hidden border border-[#D9E2E4] bg-[#0c181a] shadow-xs group/card select-none">
        {/* Clickable Image Viewport to trigger Fullscreen/Zoom */}
        <div
          onClick={() => setIsLightboxOpen(true)}
          title="Click to view full screen & zoom in"
          className="relative w-full h-full cursor-zoom-in flex items-center justify-center"
        >
          <Image
            src={currentImage.url}
            alt={currentImage.altText || `${projectTitle} screenshot ${selectedIdx + 1}`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 850px"
            unoptimized={!isOptimizableImage(currentImage.url)}
            referrerPolicy="no-referrer"
            className="object-contain transition-transform duration-300 group-hover/card:scale-[1.01]"
          />
        </div>

        {/* Counter Badge (Top Left) */}
        {total > 1 && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider flex items-center gap-1.5 shadow-md z-10 pointer-events-none">
            <span>{selectedIdx + 1}</span>
            <span className="opacity-50">/</span>
            <span>{total}</span>
          </div>
        )}

        {/* Fullscreen / Zoom Button (Top Right) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsLightboxOpen(true);
          }}
          title="Open in Full Screen & Zoom"
          className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/85 text-white text-xs font-semibold backdrop-blur-md shadow-md transition-all hover:scale-105 active:scale-95 z-20 cursor-pointer flex items-center gap-1.5"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Full Screen</span>
        </button>

        {/* Left / Right Navigation Arrows on Main Hero Image (< and >) */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              title="Previous Screenshot (←)"
              aria-label="Previous screenshot"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer z-20"
            >
              <ChevronLeft className="w-6 h-6 -translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              title="Next Screenshot (→)"
              aria-label="Next screenshot"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer z-20"
            >
              <ChevronRight className="w-6 h-6 translate-x-0.5" />
            </button>
          </>
        )}
      </div>

      {/* ── 2. Scrollable Thumbnails Strip (Scrollbar Removed + Scroll Arrows) ── */}
      {total > 1 && (
        <div className="relative flex items-center gap-2 group/strip">
          {/* Scroll Left Arrow */}
          <button
            type="button"
            onClick={() => scrollThumbnails("left")}
            title="Scroll screenshots left"
            aria-label="Scroll screenshots left"
            className="w-8 h-14 rounded-lg bg-white hover:bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] flex items-center justify-center shadow-xs shrink-0 transition active:scale-95 cursor-pointer hover:border-[#155761]/40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Thumbnails Container with Scrollbar Removed */}
          <div
            ref={thumbStripRef}
            className="flex-1 flex gap-2.5 overflow-x-auto scroll-smooth py-1 px-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                data-thumb-index={idx}
                type="button"
                onClick={() => {
                  setSelectedIdx(idx);
                  setIsZoomed(false);
                }}
                title={img.altText || `View Screenshot #${idx + 1}`}
                className={`relative aspect-video w-24 sm:w-28 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shadow-2xs ${
                  selectedIdx === idx
                    ? "border-[#155761] ring-2 ring-[#155761]/30 scale-102"
                    : "border-[#D9E2E4] opacity-75 hover:opacity-100 hover:border-[#155761]/50"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.altText || `${projectTitle} preview thumbnail ${idx + 1}`}
                  fill
                  sizes="120px"
                  unoptimized={!isOptimizableImage(img.url)}
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold backdrop-blur-xs">
                  {idx + 1}
                </span>
              </button>
            ))}
          </div>

          {/* Scroll Right Arrow */}
          <button
            type="button"
            onClick={() => scrollThumbnails("right")}
            title="Scroll screenshots right"
            aria-label="Scroll screenshots right"
            className="w-8 h-14 rounded-lg bg-white hover:bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] flex items-center justify-center shadow-xs shrink-0 transition active:scale-95 cursor-pointer hover:border-[#155761]/40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── 3. Interactive Fullscreen & Zoom Lightbox Modal ────────────────── */}
      {isLightboxOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
            onClick={() => {
              setIsLightboxOpen(false);
              setIsZoomed(false);
            }}
          >
          {/* Lightbox Header Bar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between px-4 sm:px-6 py-3 bg-black/40 border-b border-white/10 text-white z-20 shrink-0"
          >
            <div className="flex items-center gap-3 truncate pr-4">
              <span className="font-bold text-sm sm:text-base text-white truncate">
                {projectTitle}
              </span>
              <span className="text-xs text-gray-400 font-mono bg-white/10 px-2 py-0.5 rounded-full shrink-0">
                {selectedIdx + 1} of {total}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Zoom In / Zoom Out Toggle Button */}
              <button
                type="button"
                onClick={() => setIsZoomed((z) => !z)}
                title={isZoomed ? "Reset Zoom (1x)" : "Zoom In (1.75x)"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition active:scale-95 cursor-pointer"
              >
                {isZoomed ? (
                  <>
                    <ZoomOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Reset Zoom</span>
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-4 h-4" />
                    <span className="hidden sm:inline">Zoom In</span>
                  </>
                )}
              </button>

              {/* Close Modal Button */}
              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setIsZoomed(false);
                }}
                title="Close Full Screen (Esc)"
                aria-label="Close"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image Viewport */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex-1 flex items-center justify-center overflow-auto p-2 sm:p-6"
          >
            {/* Left Nav Arrow (<) */}
            {total > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                title="Previous Screenshot (←)"
                aria-label="Previous screenshot"
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer z-30"
              >
                <ChevronLeft className="w-7 h-7 -translate-x-0.5" />
              </button>
            )}

            {/* Main Full-Res Lightbox Image */}
            <div
              onClick={() => setIsZoomed((z) => !z)}
              title={isZoomed ? "Click to reset zoom" : "Click to zoom in"}
              className={`relative max-w-full max-h-full transition-all duration-300 flex items-center justify-center ${
                isZoomed
                  ? "scale-150 sm:scale-175 cursor-zoom-out my-auto"
                  : "scale-100 cursor-zoom-in w-full h-full"
              }`}
            >
              <div key={`lb-img-${currentImage.id || selectedIdx}`} className="relative w-full h-[65vh] sm:h-[75vh]">
                <Image
                  src={currentImage.url}
                  alt={currentImage.altText || `${projectTitle} screenshot`}
                  fill
                  sizes="100vw"
                  unoptimized={!isOptimizableImage(currentImage.url)}
                  referrerPolicy="no-referrer"
                  className="object-contain"
                />
              </div>
            </div>

            {/* Right Nav Arrow (>) */}
            {total > 1 && (
              <button
                type="button"
                onClick={handleNext}
                title="Next Screenshot (→)"
                aria-label="Next screenshot"
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-md shadow-xl transition-all hover:scale-110 active:scale-95 cursor-pointer z-30"
              >
                <ChevronRight className="w-7 h-7 translate-x-0.5" />
              </button>
            )}
          </div>

          {/* Lightbox Footer Bar with Mini Thumbnail Strip & Caption */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="p-3 sm:p-4 bg-black/60 border-t border-white/10 text-white z-20 shrink-0 space-y-2"
          >
            {/* Caption */}
            {currentImage.caption && (
              <p className="text-center text-xs text-gray-300 truncate max-w-2xl mx-auto font-medium">
                {currentImage.caption}
              </p>
            )}

            {/* Mini Thumbnails Strip in Lightbox (No scrollbar) */}
            {total > 1 && (
              <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedIdx(idx);
                      setIsZoomed(false);
                    }}
                    title={img.altText || `Screenshot #${idx + 1}`}
                    className={`relative aspect-video w-16 sm:w-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedIdx === idx
                        ? "border-emerald-400 ring-2 ring-emerald-400/40 scale-105"
                        : "border-white/20 opacity-60 hover:opacity-100 hover:border-white/50"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText || `Screenshot ${idx + 1}`}
                      fill
                      sizes="80px"
                      unoptimized={!isOptimizableImage(img.url)}
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
