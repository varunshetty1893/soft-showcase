"use client";

import * as React from "react";
import Link from "next/link";
import {
  Headphones,
  Plus,
  Clock,
  ArrowRight,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";

interface PartnerSupportTicketItem {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  _count?: {
    messages?: number;
  };
}

interface PartnerSupportListProps {
  initialTickets: PartnerSupportTicketItem[];
}

export function PartnerSupportList({ initialTickets }: PartnerSupportListProps) {
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
        const matchesNum = t.ticketNumber.toLowerCase().includes(q);
        const matchesSub = t.subject.toLowerCase().includes(q);
        const matchesDesc = t.description.toLowerCase().includes(q);
        const matchesCat = t.category.toLowerCase().includes(q);
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
          <h3 className="text-base font-bold text-[#102124]">No Support Tickets</h3>
          <p className="text-xs text-[#526267] max-w-md mx-auto">
            Need assistance with your Solution Partner profile, listing review, or payment verification? Open a ticket below.
          </p>
        </div>
        <Link
          href="/partner/support/new"
          className={buttonVariants({
            variant: "primary",
            size: "sm",
            className: "gap-2",
          })}
        >
          <Plus className="w-4 h-4" />
          Open New Ticket
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
            placeholder="Search by ticket #, subject, category..."
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

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
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
          {paginatedTickets.map((ticket) => {
            const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED";

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl border border-[#D9E2E4] p-5 sm:p-6 shadow-xs space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F3F7F7] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#155761]">
                      {ticket.ticketNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isResolved
                          ? "bg-[#DDF4EC] text-[#2F7D78]"
                          : ticket.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-900"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {ticket.status}
                    </span>
                    <span className="text-[11px] text-[#526267] font-semibold bg-[#F8FAFA] px-2 py-0.5 rounded border border-[#D9E2E4]">
                      {ticket.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-[#526267]">
                    {ticket._count?.messages ? (
                      <span className="flex items-center gap-1 font-semibold text-[#155761]">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {ticket._count.messages}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(ticket.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div>
                    <h3 className="font-bold text-base text-[#102124]">
                      {ticket.subject}
                    </h3>
                    <p className="text-xs text-[#526267] mt-1 line-clamp-2 leading-relaxed">
                      {ticket.description}
                    </p>
                  </div>

                  <Link
                    href={`/partner/support/${ticket.id}`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "shrink-0 gap-1.5 text-xs",
                    })}
                  >
                    <span>View Thread</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}

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
