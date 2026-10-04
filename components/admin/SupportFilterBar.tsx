"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X, Loader2 } from "lucide-react";

export function SupportFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "";
  const currentRole = searchParams.get("role") || "";

  const [search, setSearch] = useState(currentSearch);

  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  const updateFilters = (newParams: { search?: string; status?: string; role?: string }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newParams.search !== undefined) {
      if (newParams.search.trim()) {
        params.set("search", newParams.search.trim());
      } else {
        params.delete("search");
      }
    }

    if (newParams.status !== undefined) {
      if (newParams.status && newParams.status !== "ALL") {
        params.set("status", newParams.status);
      } else {
        params.delete("status");
      }
    }

    if (newParams.role !== undefined) {
      if (newParams.role && newParams.role !== "ALL") {
        params.set("role", newParams.role);
      } else {
        params.delete("role");
      }
    }

    params.set("page", "1");

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  // Debounced search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim() === currentSearch) return;
      updateFilters({ search });
    }, 350);

    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = () => {
    setSearch("");
    const params = new URLSearchParams();
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = Boolean(currentSearch || currentStatus || currentRole);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#526267]">
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#155761]" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ticket #, subject, requester, or category..."
          className="w-full h-10 pl-10 pr-9 bg-white border border-[#D9E2E4] text-[#102124] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#155761] placeholder:text-[#526267] shadow-2xs transition-colors"
        />
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              updateFilters({ search: "" });
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#526267] hover:text-[#102124] p-1 rounded-md transition-colors"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 2 Filter Dropdowns: Status & Role */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Filter 1: Status */}
        <select
          value={currentStatus}
          onChange={(e) => updateFilters({ status: e.target.value })}
          className="bg-white border border-[#D9E2E4] text-[#102124] rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#155761] focus:ring-1 focus:ring-[#155761] shadow-2xs cursor-pointer h-10"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        {/* Filter 2: Requester Role */}
        <select
          value={currentRole}
          onChange={(e) => updateFilters({ role: e.target.value })}
          className="bg-white border border-[#D9E2E4] text-[#102124] rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#155761] focus:ring-1 focus:ring-[#155761] shadow-2xs cursor-pointer h-10"
        >
          <option value="">All Roles</option>
          <option value="customer">Customer</option>
          <option value="solution_partner">Solution Partner</option>
          <option value="admin">Admin</option>
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-[#526267] hover:text-[#155761] underline px-2 py-1 cursor-pointer font-medium"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
