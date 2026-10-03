"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  MessageSquare,
  ArrowUpRight,
  Clock,
  Mail,
  Phone,
  Store,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InquiryStatusBadge } from "@/components/customer/InquiryStatusBadge";
import type { InquiryStatus } from "@prisma/client";

interface CustomerInquiryItem {
  id: string;
  status: InquiryStatus;
  message: string;
  contactMethod: "EMAIL" | "WHATSAPP";
  createdAt: string | Date;
  project: {
    id: string;
    title: string;
    slug: string;
    images?: Array<{ url: string }> | null;
  };
  provider: {
    id: string;
    displayName: string;
    email: string;
  };
}

interface CustomerInquiriesListProps {
  initialInquiries: CustomerInquiryItem[];
}

export function CustomerInquiriesList({ initialInquiries }: CustomerInquiriesListProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const filteredInquiries = React.useMemo(() => {
    return initialInquiries.filter((inquiry) => {
      if (statusFilter !== "ALL" && inquiry.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesProject = inquiry.project.title.toLowerCase().includes(q);
        const matchesProvider = inquiry.provider.displayName.toLowerCase().includes(q);
        const matchesMessage = inquiry.message.toLowerCase().includes(q);
        if (!matchesProject && !matchesProvider && !matchesMessage) return false;
      }
      return true;
    });
  }, [initialInquiries, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInquiries.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedInquiries = filteredInquiries.slice(
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
            placeholder="Search by project, provider, or message..."
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
            { label: "Contacted", value: "CONTACTED" },
            { label: "Discussing", value: "DISCUSSING" },
            { label: "Quoted", value: "QUOTED" },
            { label: "Closed", value: "CLOSED" },
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

      {filteredInquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-10 text-center shadow-xs space-y-2">
          <MessageSquare className="w-8 h-8 text-[#526267] mx-auto opacity-50" />
          <h4 className="text-sm font-bold text-[#102124]">No Inquiries Found</h4>
          <p className="text-xs text-[#526267] max-w-sm mx-auto">
            {search
              ? `No inquiries match "${search}". Try a different keyword.`
              : `No inquiries found under status "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedInquiries.map((inquiry) => {
            const formattedDate = new Date(inquiry.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            const primaryImage = inquiry.project.images?.[0]?.url;

            return (
              <div
                key={inquiry.id}
                className="bg-white rounded-2xl border border-[#D9E2E4] p-6 shadow-xs hover:border-[#155761]/40 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  {/* Project Info */}
                  <div className="flex items-start gap-4">
                    {primaryImage ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#D9E2E4] shrink-0">
                        <Image
                          src={primaryImage}
                          alt={inquiry.project.title}
                          fill
                          sizes="64px"
                          unoptimized={primaryImage.startsWith("data:")}
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-[#F8FAFA] text-[#526267] border border-[#D9E2E4] flex items-center justify-center shrink-0">
                        <Store className="w-6 h-6 text-[#526267]" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/projects/${inquiry.project.slug}`}
                          className="font-bold text-[#102124] hover:text-[#155761] transition-colors text-base inline-flex items-center gap-1 group"
                        >
                          <span>{inquiry.project.title}</span>
                          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-[#155761] transition-opacity" />
                        </Link>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#526267]">
                        <span className="flex items-center gap-1">
                          <Store className="w-3.5 h-3.5 text-[#526267]" />
                          <span>Provider:</span>
                          <strong className="text-[#102124] font-medium">
                            {inquiry.provider.displayName}
                          </strong>
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#526267]" />
                          <span>Submitted:</span>
                          <span className="text-[#102124]">{formattedDate}</span>
                        </span>

                        <span className="flex items-center gap-1">
                          {inquiry.contactMethod === "WHATSAPP" ? (
                            <>
                              <Phone className="w-3.5 h-3.5 text-[#2F7D78]" />
                              <span className="text-[#2F7D78] font-medium">WhatsApp</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5 text-[#155761]" />
                              <span className="text-[#155761] font-medium">Email</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    <InquiryStatusBadge status={inquiry.status} />
                  </div>
                </div>

                {/* Inquiry Message Details */}
                <div className="mt-4 pt-4 border-t border-[#F3F7F7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#526267] mb-1.5">
                    Your Message
                  </div>
                  <p className="text-sm text-[#102124] bg-[#F8FAFA] rounded-xl p-3.5 border border-[#D9E2E4] whitespace-pre-wrap leading-relaxed">
                    {inquiry.message}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Pagination Footer */}
          {filteredInquiries.length > 0 && (
            <div className="p-4 rounded-2xl border border-[#D9E2E4] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#526267] shadow-xs">
              <div>
                Showing <span className="font-semibold text-[#102124]">{(currentPage - 1) * pageSize + 1}</span>–
                <span className="font-semibold text-[#102124]">{Math.min(currentPage * pageSize, filteredInquiries.length)}</span> of{" "}
                <span className="font-semibold text-[#102124]">{filteredInquiries.length}</span> inquiries
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
