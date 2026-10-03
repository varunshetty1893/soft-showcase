"use client";

import * as React from "react";
import Link from "next/link";
import {
  Headphones,
  Plus,
  ArrowRight,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";

export interface CustomerSupportTicketItem {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: {
    messages?: number;
  };
}

interface CustomerSupportListProps {
  initialTickets: CustomerSupportTicketItem[];
}

export function CustomerSupportList({ initialTickets }: CustomerSupportListProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const filteredTickets = React.useMemo(() => {
    return initialTickets.filter((t) => {
      const isResolved = t.status === "RESOLVED" || t.status === "CLOSED";
      if (statusFilter === "OPEN" && isResolved) return false;
      if (statusFilter === "RESOLVED" && !isResolved) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesNum = (t.ticketNumber || "").toLowerCase().includes(q);
        const matchesSub = (t.subject || "").toLowerCase().includes(q);
        const matchesDesc = (t.description || "").toLowerCase().includes(q);
        const matchesCat = (t.category || "").toLowerCase().includes(q);
        if (!matchesNum && !matchesSub && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [initialTickets, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (initialTickets.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-12 text-center shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#F3F7F7] text-[#155761] flex items-center justify-center mx-auto">
          <Headphones className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#102124]">No Support Tickets Opened</h3>
          <p className="text-xs text-[#526267] max-w-md mx-auto">
            Have a question about a software purchase, custom scope, or need technical help? Open a support ticket anytime.
          </p>
        </div>
        <Link
          href="/my-support/new"
          className={buttonVariants({
            variant: "primary",
            size: "sm",
            className: "gap-2 font-bold shadow-xs",
          })}
        >
          <Plus className="w-4 h-4" />
          Open Support Ticket
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search Bar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="w-4 h-4 text-[#526267] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by ticket #, subject, category, or description..."
            className="w-full h-9 pl-9 pr-8 bg-[#F8FAFA] border border-[#D9E2E4] text-[#102124] rounded-xl text-xs focus:outline-none focus:border-[#155761] placeholder:text-[#526267]"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#526267] hover:text-[#102124] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div
          className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth touch-pan-x"
          onWheel={(e) => {
            if (e.deltaY !== 0 && e.currentTarget.scrollWidth > e.currentTarget.clientWidth) {
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
        >
          {[
            { label: "All Tickets", value: "ALL" },
            { label: "Open", value: "OPEN" },
            { label: "Resolved", value: "RESOLVED" },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                statusFilter === tab.value
                  ? "bg-[#155761] text-white shadow-2xs"
                  : "bg-white text-[#526267] border border-[#D9E2E4] hover:bg-[#F3F7F7]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-10 text-center shadow-xs space-y-2">
          <Headphones className="w-8 h-8 text-[#526267] mx-auto opacity-50" />
          <h4 className="text-sm font-bold text-[#102124]">No Support Tickets Found</h4>
          <p className="text-xs text-[#526267] max-w-sm mx-auto">
            {search
              ? `No tickets matched "${search}". Try searching with a different term.`
              : `No tickets found under "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {paginatedTickets.map((t) => {
              const isResolved = t.status === "RESOLVED" || t.status === "CLOSED";

              return (
                <Link
                  key={t.id}
                  href={`/my-support/${t.id}`}
                  className="block bg-white rounded-2xl border border-[#D9E2E4] p-5 shadow-xs hover:border-[#155761] transition-all hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#155761]">
                          {t.ticketNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isResolved
                              ? "bg-[#DDF4EC] text-[#2F7D78]"
                              : t.status === "IN_PROGRESS"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-amber-100 text-amber-900"
                          }`}
                        >
                          {t.status}
                        </span>
                        <span className="text-[10px] text-[#526267] font-semibold bg-[#F3F7F7] px-2 py-0.5 rounded">
                          {t.category}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-[#102124]">{t.subject}</h3>
                      <p className="text-xs text-[#526267] line-clamp-1">{t.description}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[#526267] shrink-0">
                      <span className="flex items-center gap-1 font-semibold text-[#155761]">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {t._count?.messages ?? 0} messages
                      </span>
                      <span className="text-[11px] font-mono">
                        {formatDate(t.updatedAt)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#526267]" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination Footer */}
          {filteredTickets.length > 0 && (
            <div className="p-4 rounded-2xl border border-[#D9E2E4] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#526267] shadow-xs">
              <div>
                Showing <span className="font-semibold text-[#102124]">{(currentPage - 1) * pageSize + 1}</span>–
                <span className="font-semibold text-[#102124]">{Math.min(currentPage * pageSize, filteredTickets.length)}</span> of{" "}
                <span className="font-semibold text-[#102124]">{filteredTickets.length}</span> tickets
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[#526267] mr-1">
                  Page {currentPage} of {Math.max(1, totalPages)}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-xs h-8 gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Previous
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="text-xs h-8 gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
