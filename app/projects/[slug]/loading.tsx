// app/projects/[slug]/loading.tsx
// Instant skeleton loading state for project detail pages.
// Eliminates perceived click latency when navigating to projects.

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function ProjectDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFA] text-[#102124]">
      <Navbar />

      <main className="flex-1 py-8 sm:py-10 animate-pulse">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-12 bg-[#D9E2E4]/60 rounded-md" />
            <div className="h-3 w-3 bg-[#D9E2E4]/40 rounded-full" />
            <div className="h-4 w-16 bg-[#D9E2E4]/60 rounded-md" />
            <div className="h-3 w-3 bg-[#D9E2E4]/40 rounded-full" />
            <div className="h-4 w-32 bg-[#D9E2E4]/60 rounded-md" />
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Content Column (7 cols) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              {/* Media Gallery Skeleton */}
              <div className="bg-white rounded-2xl border border-[#D9E2E4] p-4 shadow-xs">
                <div className="aspect-video w-full bg-[#102124]/5 rounded-xl" />
                <div className="flex gap-3 mt-4">
                  <div className="h-16 w-24 bg-[#102124]/5 rounded-lg" />
                  <div className="h-16 w-24 bg-[#102124]/5 rounded-lg" />
                  <div className="h-16 w-24 bg-[#102124]/5 rounded-lg" />
                </div>
              </div>

              {/* Title & Description Skeleton */}
              <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-[#D9E2E4]/60 rounded-full" />
                  <div className="h-6 w-24 bg-[#D9E2E4]/60 rounded-full" />
                </div>
                <div className="h-8 w-3/4 bg-[#102124]/10 rounded-lg" />
                <div className="space-y-2 pt-2">
                  <div className="h-4 w-full bg-[#D9E2E4]/50 rounded-md" />
                  <div className="h-4 w-5/6 bg-[#D9E2E4]/50 rounded-md" />
                  <div className="h-4 w-4/6 bg-[#D9E2E4]/50 rounded-md" />
                </div>
              </div>

              {/* Features Skeleton */}
              <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
                <div className="h-6 w-40 bg-[#102124]/10 rounded-md" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="h-16 bg-[#F8FAFA] border border-[#D9E2E4] rounded-xl" />
                  <div className="h-16 bg-[#F8FAFA] border border-[#D9E2E4] rounded-xl" />
                  <div className="h-16 bg-[#F8FAFA] border border-[#D9E2E4] rounded-xl" />
                  <div className="h-16 bg-[#F8FAFA] border border-[#D9E2E4] rounded-xl" />
                </div>
              </div>
            </div>

            {/* Right Sticky Sidebar (5 cols) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6">
              {/* Pricing & CTA Card Skeleton */}
              <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-6">
                <div className="space-y-2">
                  <div className="h-9 w-32 bg-[#155761]/15 rounded-lg" />
                  <div className="h-4 w-28 bg-[#D9E2E4]/50 rounded-md" />
                </div>
                <div className="h-12 w-full bg-[#155761]/20 rounded-xl" />
                <div className="space-y-2 pt-2 border-t border-[#F3F7F7]">
                  <div className="h-4 w-full bg-[#D9E2E4]/40 rounded-md" />
                  <div className="h-4 w-4/5 bg-[#D9E2E4]/40 rounded-md" />
                </div>
              </div>

              {/* Provider Card Skeleton */}
              <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-[#102124]/10" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-5 w-28 bg-[#102124]/10 rounded-md" />
                    <div className="h-3 w-36 bg-[#2F7D78]/20 rounded-md" />
                  </div>
                </div>
                <div className="h-11 w-full bg-[#2F7D78]/15 rounded-xl" />
                <div className="h-11 w-full bg-[#D9E2E4]/40 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
