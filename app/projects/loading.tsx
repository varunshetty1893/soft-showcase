// app/projects/loading.tsx
// Instant skeleton loading state for the project catalog page.

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function ProjectsLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFA] text-[#102124]">
      <Navbar />

      <main className="flex-1 pb-16 animate-pulse">
        {/* Sticky Header Skeleton */}
        <div className="border-b border-[#D9E2E4] py-5 bg-white/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-[#102124]/10 rounded-lg" />
              <div className="h-4 w-48 bg-[#D9E2E4]/60 rounded-md" />
            </div>
            <div className="h-10 w-full md:w-80 bg-[#D9E2E4]/40 rounded-xl" />
          </div>
        </div>

        {/* Catalog Layout Skeleton */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Sidebar Skeleton */}
            <div className="w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-[#D9E2E4] p-5 space-y-3">
              <div className="h-5 w-28 bg-[#102124]/10 rounded-md pb-2 border-b border-[#F3F7F7]" />
              <div className="space-y-2 pt-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-8 bg-[#F8FAFA] rounded-lg" />
                ))}
              </div>
            </div>

            {/* Grid Skeleton */}
            <div className="flex-1 min-w-0 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-[#D9E2E4] overflow-hidden shadow-xs space-y-4 pb-4"
                >
                  <div className="aspect-video bg-[#102124]/5" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 w-3/4 bg-[#102124]/10 rounded-md" />
                    <div className="h-3 w-full bg-[#D9E2E4]/50 rounded-md" />
                    <div className="h-3 w-4/5 bg-[#D9E2E4]/50 rounded-md" />
                    <div className="pt-3 border-t border-[#F3F7F7] flex justify-between items-center">
                      <div className="h-5 w-16 bg-[#155761]/15 rounded-md" />
                      <div className="h-4 w-20 bg-[#D9E2E4]/40 rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
