"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

interface TableSearchBarProps {
  placeholder?: string;
  className?: string;
  defaultValue?: string;
}

export function TableSearchBar({
  placeholder = "Search...",
  className = "",
  defaultValue = "",
}: TableSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(defaultValue || searchParams.get("search") || "");

  useEffect(() => {
    setQuery(searchParams.get("search") || "");
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get("search") || "";
      if (query.trim() === current) return;

      const params = new URLSearchParams(searchParams.toString());
      if (query.trim()) {
        params.set("search", query.trim());
      } else {
        params.delete("search");
      }
      params.set("page", "1");

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    }, 350);

    return () => clearTimeout(timer);
  }, [query, pathname, router, searchParams]);

  const handleClear = () => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.set("page", "1");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className={`relative flex-1 ${className}`}>
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#526267]">
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#155761]" />
        ) : (
          <Search className="w-4 h-4" />
        )}
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-9 bg-white border border-[#D9E2E4] text-[#102124] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#155761] placeholder:text-[#526267] shadow-2xs transition-colors"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#526267] hover:text-[#102124] p-1 rounded-md transition-colors"
          title="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
