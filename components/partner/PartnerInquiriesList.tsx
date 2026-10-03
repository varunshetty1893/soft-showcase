"use client";

import * as React from "react";
import {
  MessageSquare,
  Mail,
  MessageCircle,
  Clock,
  DollarSign,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";

interface PartnerInquiryItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  budget?: string | null;
  message: string;
  status: string;
  createdAt: string | Date;
  project?: {
    id: string;
    title: string;
    slug?: string;
  } | null;
}

interface PartnerInquiriesListProps {
  initialInquiries: PartnerInquiryItem[];
}

export function PartnerInquiriesList({ initialInquiries }: PartnerInquiriesListProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const filteredInquiries = React.useMemo(() => {
    return initialInquiries.filter((inq) => {
      if (statusFilter !== "ALL" && inq.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = inq.name.toLowerCase().includes(q);
        const matchesEmail = inq.email.toLowerCase().includes(q);
        const matchesPhone = (inq.phone || "").toLowerCase().includes(q);
        const matchesProject = (inq.project?.title || "").toLowerCase().includes(q);
        const matchesMessage = inq.message.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesProject && !matchesMessage) {
          return false;
        }
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

  if (initialInquiries.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-12 text-center shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#F3F7F7] text-[#155761] flex items-center justify-center mx-auto">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#102124]">No Inquiries Yet</h3>
          <p className="text-xs text-[#526267] max-w-md mx-auto">
            When prospective buyers submit inquiry forms or WhatsApp messages on your software solutions, they will appear here.
          </p>
        </div>
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
            placeholder="Search by customer, email, phone, project, or message..."
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
            { label: "All", value: "ALL" },
            { label: "New", value: "NEW" },
            { label: "Contacted", value: "CONTACTED" },
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
          <h4 className="text-sm font-bold text-[#102124]">No Enquiries Found</h4>
          <p className="text-xs text-[#526267] max-w-sm mx-auto">
            {search
              ? `No inquiries matched "${search}". Try searching with a different term.`
              : `No inquiries found under "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedInquiries.map((inq) => {
            const whatsappUrl = inq.phone
              ? `https://wa.me/${inq.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Hi ${inq.name}, I am following up on your enquiry regarding "${inq.project?.title || "Soft Showcase"}"!`
                )}`
              : null;

            return (
              <div
                key={inq.id}
                className="bg-white rounded-2xl border border-[#D9E2E4] p-5 sm:p-6 shadow-xs space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3F7F7] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-[#102124]">{inq.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inq.status === "NEW"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : inq.status === "CONTACTED"
                            ? "bg-[#DDF4EC] text-[#2F7D78] border border-[#2F7D78]/30"
                            : "bg-[#F3F7F7] text-[#526267]"
                        }`}
                      >
                        {inq.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#526267] mt-0.5">
                      Interested in: <strong className="text-[#102124]">{inq.project?.title || "Custom Build"}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat on WhatsApp</span>
                      </a>
                    )}
                    <a
                      href={`mailto:${inq.email}?subject=Follow-up:%20${encodeURIComponent(inq.project?.title || "Software Solution")}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F3F7F7] hover:bg-[#E5EEEE] text-[#155761] border border-[#D9E2E4] text-xs font-semibold transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </a>
                  </div>
                </div>

                {/* Message Body */}
                <div className="text-xs text-[#526267] bg-[#F8FAFA] p-4 rounded-xl border border-[#D9E2E4] leading-relaxed">
                  <p className="font-semibold text-[#102124] mb-1">Customer Message:</p>
                  <p className="whitespace-pre-line">{inq.message}</p>
                </div>

                {/* Metadata details */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#526267] pt-1">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#155761]" />
                    <span>{inq.email}</span>
                  </div>
                  {inq.phone && (
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{inq.phone}</span>
                    </div>
                  )}
                  {inq.budget && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-[#2F7D78]" />
                      <span>Budget: {inq.budget}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 ml-auto text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-[#526267]" />
                    <span>{formatDate(inq.createdAt)}</span>
                  </div>
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
