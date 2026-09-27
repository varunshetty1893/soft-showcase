// components/projects/ProjectSearch.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ProjectSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = React.useState(searchParams.get("q") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("q", query.trim());
      params.set("page", "1");
    } else {
      params.delete("q");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const clearSearch = () => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <Input
        type="search"
        placeholder="Search projects by keyword, feature, or tech..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pl-10 pr-10 h-10 w-full bg-white rounded-xl shadow-xs border-gray-200 focus-visible:ring-indigo-600 text-sm"
      />
      {query && (
        <button
          type="button"
          onClick={clearSearch}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </form>
  );
}
