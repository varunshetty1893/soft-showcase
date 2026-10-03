"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  itemName?: string;
  className?: string;
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 20,
  itemName = "items",
  className = "",
}: TablePaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalItems === 0) return null;

  const start = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const end = Math.min(currentPage * pageSize, totalItems);

  const getPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div
      className={`p-4 border-t border-[#D9E2E4] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#526267] ${className}`}
    >
      <div>
        Showing <span className="font-semibold text-[#102124]">{start}</span>–
        <span className="font-semibold text-[#102124]">{end}</span> of{" "}
        <span className="font-semibold text-[#102124]">{totalItems}</span> {itemName}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-[11px] font-medium text-[#526267] mr-1">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>

        {currentPage > 1 ? (
          <Link
            href={getPageUrl(currentPage - 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#D9E2E4] bg-white text-[#102124] hover:bg-[#F3F7F7] font-semibold transition shadow-2xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#D9E2E4] bg-gray-50 text-[#8A9A9E] font-medium opacity-60 cursor-not-allowed">
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </span>
        )}

        {currentPage < totalPages ? (
          <Link
            href={getPageUrl(currentPage + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#D9E2E4] bg-white text-[#102124] hover:bg-[#F3F7F7] font-semibold transition shadow-2xs"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#D9E2E4] bg-gray-50 text-[#8A9A9E] font-medium opacity-60 cursor-not-allowed">
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}
