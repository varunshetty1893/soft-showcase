// components/projects/ProjectFilters.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter } from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface ProjectFiltersProps {
  categories: CategoryOption[];
}

export function ProjectFilters({ categories }: ProjectFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category") || "";

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearAll = () => {
    router.push(pathname);
  };

  const hasActiveFilters = Boolean(activeCategory || searchParams.get("q"));

  return (
    <aside className="w-full lg:w-64 shrink-0 lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-6">
      <div className="bg-white rounded-2xl border border-[#D9E2E4] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#F3F7F7]">
          <div className="flex items-center gap-2 text-sm font-bold text-[#102124]">
            <Filter className="w-4 h-4 text-[#155761]" />
            <span>Categories</span>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-[#155761] hover:text-[#2F7D78] font-medium cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Category list */}
        <div className="mt-3 flex flex-col space-y-1">
          <button
            onClick={() => updateFilter("category", null)}
            className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              !activeCategory
                ? "bg-[#F3F7F7] text-[#155761] font-semibold border border-[#D9E2E4]"
                : "text-[#526267] hover:bg-[#F3F7F7] hover:text-[#102124]"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => {
            const isSelected = activeCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => updateFilter("category", isSelected ? null : cat.slug)}
                className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#F3F7F7] text-[#155761] font-semibold border border-[#D9E2E4]"
                    : "text-[#526267] hover:bg-[#F3F7F7] hover:text-[#102124]"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
