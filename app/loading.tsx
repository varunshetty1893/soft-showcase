// app/loading.tsx
// High-craft, branded loading state with skeleton cards, animated gradients, and status cues.

import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F8FAFA] flex flex-col antialiased">
      {/* Top indeterminate progress line */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#D9E2E4] overflow-hidden">
        <div className="h-full bg-gradient-to-r from-[#155761] via-[#2F7D78] to-[#155761] animate-[pulse_1.5s_ease-in-out_infinite] w-full" />
      </div>

      {/* Ambient background glow */}
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#155761]/4 rounded-full blur-[120px] -z-10" />

      {/* Main Skeleton Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* Brand Banner / Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-[#D9E2E4]">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-32 bg-white rounded-lg border border-[#D9E2E4] p-1 flex items-center justify-center shadow-xs">
                <Image
                  src="/logo.png"
                  alt="Soft Showcase"
                  width={110}
                  height={22}
                  className="h-5 w-auto object-contain opacity-80"
                  priority
                />
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#DDF4EC] text-[#2F7D78] text-xs font-semibold border border-[#2F7D78]/25">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2F7D78] animate-ping" />
                Loading showcase
              </span>
            </div>
            <div className="h-7 w-64 bg-gray-200/80 rounded-lg animate-pulse" />
            <div className="h-4 w-96 max-w-full bg-gray-200/60 rounded animate-pulse" />
          </div>

          {/* Quick skeleton search bar */}
          <div className="h-10 w-72 max-w-full bg-white rounded-xl border border-[#D9E2E4] animate-pulse shadow-xs" />
        </div>

        {/* Filter Pills Skeleton */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {[80, 110, 95, 120, 100, 90].map((width, i) => (
            <div
              key={i}
              className="h-8 rounded-full bg-white border border-[#D9E2E4] animate-pulse shrink-0"
              style={{ width: `${width}px` }}
            />
          ))}
        </div>

        {/* 3-Column Project Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-[#D9E2E4] p-5 shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Image Aspect ratio skeleton with shimmer */}
                <div className="relative aspect-video w-full rounded-xl bg-gradient-to-br from-gray-100 to-gray-200/80 border border-[#D9E2E4] overflow-hidden">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                  <div className="absolute top-3 left-3 h-5 w-20 bg-white/90 rounded-md border border-[#D9E2E4]" />
                </div>

                {/* Title & Short description skeleton */}
                <div className="space-y-2 pt-1">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3.5 w-full bg-gray-100 rounded animate-pulse" />
                  <div className="h-3.5 w-5/6 bg-gray-100 rounded animate-pulse" />
                </div>

                {/* Tech Badges */}
                <div className="flex gap-1.5 pt-1">
                  <div className="h-5 w-14 bg-[#F3F7F7] rounded border border-[#D9E2E4]" />
                  <div className="h-5 w-16 bg-[#F3F7F7] rounded border border-[#D9E2E4]" />
                  <div className="h-5 w-12 bg-[#F3F7F7] rounded border border-[#D9E2E4]" />
                </div>
              </div>

              {/* Footer Price & Provider Skeleton */}
              <div className="pt-3.5 border-t border-[#F3F7F7] flex items-center justify-between">
                <div className="space-y-1">
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="h-7 w-24 bg-[#155761]/10 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
