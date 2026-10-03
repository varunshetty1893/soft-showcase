// components/projects/Pagination.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 0) return null;

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-center gap-2 pt-8">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => navigateToPage(currentPage - 1)}
        className="gap-1 px-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Previous</span>
      </Button>

      <span className="text-xs text-gray-500 font-medium px-2">
        Page {currentPage} of {Math.max(1, totalPages)}
      </span>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => navigateToPage(currentPage + 1)}
        className="gap-1 px-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>Next</span>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
