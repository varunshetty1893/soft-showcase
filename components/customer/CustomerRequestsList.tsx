"use client";

import * as React from "react";
import {
  FileCode2,
  Calendar,
  Wallet,
  Tag,
  Code2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  FileQuestion,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge } from "@/components/customer/RequestStatusBadge";
import type { CustomRequestStatus } from "@prisma/client";

interface CustomerRequestItem {
  id: string;
  projectTitle: string;
  category?: string | null;
  budget?: string | null;
  deadline?: string | null;
  description: string;
  requiredFeatures?: string | null;
  technologyPreferences?: string[] | null;
  status: CustomRequestStatus;
  createdAt: string | Date;
}

interface CustomerRequestsListProps {
  initialRequests: CustomerRequestItem[];
}

export function CustomerRequestsList({ initialRequests }: CustomerRequestsListProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const filteredRequests = React.useMemo(() => {
    return initialRequests.filter((req) => {
      if (statusFilter !== "ALL" && req.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = req.projectTitle.toLowerCase().includes(q);
        const matchesCat = (req.category || "").toLowerCase().includes(q);
        const matchesDesc = req.description.toLowerCase().includes(q);
        const matchesFeatures = (req.requiredFeatures || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat && !matchesDesc && !matchesFeatures) return false;
      }
      return true;
    });
  }, [initialRequests, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
            placeholder="Search by title, category, or scope keywords..."
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
            { label: "All", value: "ALL" },
            { label: "New", value: "NEW" },
            { label: "Reviewing", value: "REVIEWING" },
            { label: "In Progress", value: "IN_PROGRESS" },
            { label: "Completed", value: "COMPLETED" },
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

      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-10 text-center shadow-xs space-y-2">
          <FileQuestion className="w-8 h-8 text-[#526267] mx-auto opacity-50" />
          <h4 className="text-sm font-bold text-[#102124]">No Custom Requests Found</h4>
          <p className="text-xs text-[#526267] max-w-sm mx-auto">
            {search
              ? `No requests match "${search}". Try searching with a different term.`
              : `No custom requests found under "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {paginatedRequests.map((req) => {
            const formattedDate = new Date(req.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-7 shadow-xs hover:border-[#155761]/40 transition-colors"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#102124] flex items-center gap-2">
                      <FileCode2 className="w-5 h-5 text-[#155761] shrink-0" />
                      <span>{req.projectTitle}</span>
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#526267] mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#526267]" />
                        <span>Submitted on {formattedDate}</span>
                      </span>

                      {req.category && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#F3F7F7] border border-[#D9E2E4] text-[#102124] font-medium">
                          <Tag className="w-3 h-3 text-[#526267]" />
                          {req.category}
                        </span>
                      )}

                      {req.budget && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#DDF4EC] text-[#2F7D78] font-medium border border-[#2F7D78]/25">
                          <Wallet className="w-3 h-3 text-[#2F7D78]" />
                          Budget: {req.budget}
                        </span>
                      )}

                      {req.deadline && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-medium border border-amber-200">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          Target: {req.deadline}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <RequestStatusBadge status={req.status} />
                  </div>
                </div>

                {/* Tech Preferences if any */}
                {req.technologyPreferences && req.technologyPreferences.length > 0 && (
                  <div className="mb-4 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#526267] flex items-center gap-1 mr-1">
                      <Code2 className="w-3.5 h-3.5" />
                      Preferred Tech:
                    </span>
                    {req.technologyPreferences.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded-md text-xs bg-[#F3F7F7] border border-[#D9E2E4] text-[#102124] font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description & Features Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#F3F7F7]">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#526267] mb-2">
                      Scope Description
                    </h4>
                    <p className="text-sm text-[#102124] bg-[#F8FAFA] rounded-xl p-3.5 border border-[#D9E2E4] leading-relaxed whitespace-pre-wrap">
                      {req.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#526267] mb-2">
                      Must-Have Features
                    </h4>
                    <p className="text-sm text-[#102124] bg-[#F8FAFA] rounded-xl p-3.5 border border-[#D9E2E4] leading-relaxed whitespace-pre-wrap">
                      {req.requiredFeatures || "None specified"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination Footer */}
          {filteredRequests.length > 0 && (
            <div className="p-4 rounded-2xl border border-[#D9E2E4] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#526267] shadow-xs">
              <div>
                Showing <span className="font-semibold text-[#102124]">{(currentPage - 1) * pageSize + 1}</span>–
                <span className="font-semibold text-[#102124]">{Math.min(currentPage * pageSize, filteredRequests.length)}</span> of{" "}
                <span className="font-semibold text-[#102124]">{filteredRequests.length}</span> requests
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
