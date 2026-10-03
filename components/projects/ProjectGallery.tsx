// components/projects/ProjectGallery.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut,
  X,
  RotateCcw,
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

export function ProjectGallery({ images, projectTitle }: ProjectGalleryProps) {
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [zoomLevel, setZoomLevel] = React.useState(1); // 1 = normal, 1.75 = zoomed
  const thumbnailContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  // Check scroll boundary state for thumbnail carousel
  const checkThumbnailScroll = React.useCallback(() => {
    const el = thumbnailContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  React.useEffect(() => {
    checkThumbnailScroll();
    window.addEventListener("resize", checkThumbnailScroll);
    return () => window.removeEventListener("resize", checkThumbnailScroll);
  }, [checkThumbnailScroll, images]);

  // Scroll active thumbnail into view
  React.useEffect(() => {
    const el = thumbnailContainerRef.current;
    if (!el) return;
    const activeThumb = el.children[selectedIdx] as HTMLElement;
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
    checkThumbnailScroll();
  }, [selectedIdx, checkThumbnailScroll]);

  // Navigate main / lightbox images
  const handlePrev = React.useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setSelectedIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      setZoomLevel(1);
    },
    [images.length]
  );

  const handleNext = React.useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setSelectedIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      setZoomLevel(1);
    },
    [images.length]
  );

  // Keyboard navigation for lightbox
  React.useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
        setZoomLevel(1);
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, handlePrev, handleNext]);

  // Scroll thumbnails using arrow buttons
  const scrollThumbnails = (direction: "left" | "right") => {
    const el = thumbnailContainerRef.current;
    if (!el) return;
    const offset = direction === "left" ? -220 : 220;
    el.scrollBy({ left: offset, behavior: "smooth" });
    setTimeout(checkThumbnailScroll, 250);
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
    <div className="space-y-4">
      {/* ── Primary Hero Display View (Click to Zoom / Fullscreen) ──────── */}
      <div
        onClick={() => {
          setIsLightboxOpen(true);
          setZoomLevel(1);
        }}
        className="group relative aspect-video w-full rounded-2xl overflow-hidden border border-[#D9E2E4] bg-[#102124] shadow-xs cursor-zoom-in select-none"
      >
        <Image
          src={currentImage.url}
          alt={currentImage.altText || `${projectTitle} screenshot ${selectedIdx + 1}`}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 850px"
          referrerPolicy="no-referrer"
          className="object-contain transition-transform duration-300 group-hover:scale-[1.01]"
        />

        {/* Floating Zoom / Fullscreen Hint in Top-Right */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-semibold backdrop-blur-md shadow-md transition-all opacity-85 group-hover:opacity-100">
          <Maximize2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Fullscreen / Zoom</span>
        </div>

        {/* Counter Badge in Top-Left */}
        <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-mono font-bold backdrop-blur-md shadow-md">
          {selectedIdx + 1} / {images.length}
        </div>

        {/* Main Display Navigation Arrows: Left (<) and Right (>) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous screenshot"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 text-white flex items-center justify-center backdrop-blur-md shadow-lg transition-all cursor-pointer opacity-80 group-hover:opacity-100 hover:scale-105"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              aria-label="Next screenshot"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 text-white flex items-center justify-center backdrop-blur-md shadow-lg transition-all cursor-pointer opacity-80 group-hover:opacity-100 hover:scale-105"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Caption */}
        {currentImage.caption && (
          <div className="absolute bottom-0 inset-x-0 bg-black/65 backdrop-blur-xs text-white p-3 text-xs z-10 font-medium">
            {currentImage.caption}
          </div>
        )}
      </div>

      {/* ── Thumbnail Strip (Scrollable without visible scrollbar + Scroll Arrows) ── */}
      {images.length > 1 && (
        <div className="relative flex items-center gap-2 group/carousel">
          {/* Scroll Left Button (<) */}
          <button
            type="button"
            aria-label="Scroll thumbnails left"
            disabled={!canScrollLeft}
            onClick={() => scrollThumbnails("left")}
            className="shrink-0 w-8 h-8 rounded-full border border-[#D9E2E4] bg-white hover:bg-[#F3F7F7] active:scale-95 text-[#102124] flex items-center justify-center shadow-xs transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Thumbnails Container: scrollable with NO scrollbar */}
          <div
            ref={thumbnailContainerRef}
            onScroll={checkThumbnailScroll}
            className="flex-1 flex gap-2.5 overflow-x-auto py-1 scroll-smooth select-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`relative aspect-video w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                  selectedIdx === idx
                    ? "border-[#155761] ring-2 ring-[#155761]/30 scale-102 shadow-sm"
                    : "border-[#D9E2E4] opacity-70 hover:opacity-100 hover:border-[#155761]/50"
                }`}
              >
                <Image
                  src={img.url}
                  alt={img.altText || `${projectTitle} preview thumbnail ${idx + 1}`}
                  fill
                  sizes="96px"
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          {/* Scroll Right Button (>) */}
          <button
            type="button"
            aria-label="Scroll thumbnails right"
            disabled={!canScrollRight}
            onClick={() => scrollThumbnails("right")}
            className="shrink-0 w-8 h-8 rounded-full border border-[#D9E2E4] bg-white hover:bg-[#F3F7F7] active:scale-95 text-[#102124] flex items-center justify-center shadow-xs transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Fullscreen & Zoom Lightbox Modal ─────────────────────────────── */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen screenshot view"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => {
            setIsLightboxOpen(false);
            setZoomLevel(1);
          }}
        >
          {/* Lightbox Top Control Bar */}
          <div
            className="flex items-center justify-between gap-4 z-20 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-white/10 border border-white/20">
                {selectedIdx + 1} / {images.length}
              </span>
              <span className="text-sm font-semibold text-gray-200 hidden sm:inline truncate max-w-md">
                {currentImage.altText || currentImage.caption || projectTitle}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom In / Zoom Out Controls */}
              <button
                type="button"
                title={zoomLevel > 1 ? "Reset Zoom" : "Zoom In (1.75x)"}
                onClick={() => setZoomLevel((prev) => (prev > 1 ? 1 : 1.75))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition cursor-pointer"
              >
                {zoomLevel > 1 ? (
                  <>
                    <ZoomOut className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Zoom In</span>
                  </>
                )}
              </button>

              {/* Close Button */}
              <button
                type="button"
                aria-label="Close fullscreen view"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setZoomLevel(1);
                }}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image View */}
          <div
            className="relative flex-1 flex items-center justify-center overflow-auto my-2 p-2 select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`relative max-w-full max-h-[78vh] aspect-video transition-transform duration-200 ${
                zoomLevel > 1 ? "cursor-zoom-out" : "cursor-zoom-in"
              }`}
              style={{
                width: zoomLevel > 1 ? "150%" : "100%",
                height: zoomLevel > 1 ? "150%" : "100%",
                transform: `scale(${zoomLevel})`,
              }}
              onClick={() => setZoomLevel((prev) => (prev > 1 ? 1 : 1.75))}
            >
              <Image
                src={currentImage.url}
                alt={currentImage.altText || `${projectTitle} fullscreen screenshot`}
                fill
                priority
                sizes="100vw"
                referrerPolicy="no-referrer"
                className="object-contain drop-shadow-2xl"
              />
            </div>

            {/* Left (<) Navigation Arrow */}
            {images.length > 1 && (
              <button
                type="button"
                aria-label="Previous screenshot"
                onClick={handlePrev}
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition cursor-pointer z-30"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Right (>) Navigation Arrow */}
            {images.length > 1 && (
              <button
                type="button"
                aria-label="Next screenshot"
                onClick={handleNext}
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition cursor-pointer z-30"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Lightbox Bottom Strip (Thumbnails Preview & Caption) */}
          <div
            className="flex flex-col items-center gap-3 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            {currentImage.caption && (
              <p className="text-xs text-gray-300 font-medium text-center max-w-2xl px-4">
                {currentImage.caption}
              </p>
            )}

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto max-w-full py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => {
                      setSelectedIdx(idx);
                      setZoomLevel(1);
                    }}
                    className={`relative aspect-video w-16 sm:w-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                      selectedIdx === idx
                        ? "border-white ring-2 ring-white/50 scale-105"
                        : "border-white/30 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText || `Thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      referrerPolicy="no-referrer"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
