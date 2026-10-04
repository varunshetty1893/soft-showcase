"use client";

import * as React from "react";
import {
  MessageSquare,
  Mail,
  MessageCircle,
  Clock,
  Check,
  ChevronDown,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import { useToast } from "@/components/ui/toast";

const ALL_STATUSES = ["NEW", "CONTACTED", "DISCUSSING", "QUOTED", "CLOSED"] as const;
type InquiryStatus = (typeof ALL_STATUSES)[number];

const STATUS_META: Record<InquiryStatus, { label: string; bg: string; text: string; border: string }> = {
  NEW:       { label: "New",        bg: "bg-amber-50",   text: "text-amber-800",  border: "border-amber-300" },
  CONTACTED: { label: "Contacted",  bg: "bg-teal-50",    text: "text-teal-800",   border: "border-teal-300" },
  DISCUSSING:{ label: "Discussing", bg: "bg-blue-50",    text: "text-blue-800",   border: "border-blue-300" },
  QUOTED:    { label: "Quoted",     bg: "bg-purple-50",  text: "text-purple-800", border: "border-purple-300" },
  CLOSED:    { label: "Closed",     bg: "bg-gray-100",   text: "text-gray-600",   border: "border-gray-300" },
};

interface PartnerInquiryItem {
  id: string;
  name: string;
  email: string;
  whatsapp?: string | null;
  message: string;
  status: string;
  createdAt: string | Date;
  project?: { id: string; title: string; slug?: string } | null;
}

interface PartnerInquiriesListProps {
  initialInquiries: PartnerInquiryItem[];
}

export function PartnerInquiriesList({ initialInquiries }: PartnerInquiriesListProps) {
  const toast = useToast();
  const [inquiries, setInquiries] = React.useState<PartnerInquiryItem[]>(initialInquiries);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const filteredInquiries = React.useMemo(() => {
    return inquiries.filter((inq) => {
      if (statusFilter !== "ALL" && inq.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !inq.name.toLowerCase().includes(q) &&
          !inq.email.toLowerCase().includes(q) &&
          !(inq.whatsapp || "").toLowerCase().includes(q) &&
          !(inq.project?.title || "").toLowerCase().includes(q) &&
          !inq.message.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [inquiries, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInquiries.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedInquiries = filteredInquiries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  /** Generic status updater — handles both dropdown change and WhatsApp toggle */
  const updateStatus = React.useCallback(
    async (inquiryId: string, payload: { status?: InquiryStatus; whatsappReplied?: boolean }) => {
      setUpdatingId(inquiryId);
      // Optimistic update
      const targetStatus = payload.status ?? (payload.whatsappReplied ? "CONTACTED" : undefined);
      if (targetStatus) {
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === inquiryId ? { ...inq, status: targetStatus } : inq))
        );
      }

      try {
        const res = await fetch(`/api/partner/inquiries/${inquiryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update");

        // Sync with server response
        setInquiries((prev) =>
          prev.map((inq) => (inq.id === inquiryId ? { ...inq, status: data.inquiry.status } : inq))
        );
        toast.success("Inquiry status updated.");
      } catch (err: any) {
        // Roll back optimistic update
        setInquiries([...initialInquiries]);
        toast.error(err?.message || "Failed to update inquiry status.");
      } finally {
        setUpdatingId(null);
      }
    },
    [initialInquiries, toast]
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
            Form inquiries submitted from your software solutions appear here. WhatsApp conversations open directly and are not recorded by the platform.
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
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by customer, email, project, or message..."
            className="w-full h-9 pl-9 pr-8 bg-[#F8FAFA] border border-[#D9E2E4] text-[#102124] rounded-xl text-xs focus:outline-none focus:border-[#155761] placeholder:text-[#526267]"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(""); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#526267] hover:text-[#102124] cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-1 [scrollbar-width:none]"
          onWheel={(e) => { if (e.deltaY !== 0 && e.currentTarget.scrollWidth > e.currentTarget.clientWidth) e.currentTarget.scrollLeft += e.deltaY; }}>
          {[{ label: "All", value: "ALL" }, ...ALL_STATUSES.map((s) => ({ label: STATUS_META[s].label, value: s }))].map((tab) => (
            <button key={tab.value} type="button"
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
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
            {search ? `No inquiries matched "${search}".` : `No inquiries under "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedInquiries.map((inq) => {
            const meta = STATUS_META[inq.status as InquiryStatus] ?? STATUS_META.NEW;
            const isUpdating = updatingId === inq.id;
            const whatsappUrl = inq.whatsapp
              ? `https://wa.me/${inq.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Hi ${inq.name}, following up on your enquiry for "${inq.project?.title ?? "Soft Showcase"}".`
                )}`
              : null;

            return (
              <div key={inq.id} className="bg-white rounded-2xl border border-[#D9E2E4] p-5 sm:p-6 shadow-xs space-y-4 hover:shadow-md transition-shadow">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#F3F7F7] pb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-[#102124] truncate">{inq.name}</h3>
                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${meta.bg} ${meta.text} ${meta.border}`}>
                        {isUpdating && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#526267] mt-0.5 truncate">
                      Interested in:{" "}
                      {inq.project ? (
                        <strong className="text-[#102124]">{inq.project.title}</strong>
                      ) : (
                        <span className="italic text-[#8A9B9F]">Project no longer available</span>
                      )}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {whatsappUrl && (
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    <a href={`mailto:${inq.email}?subject=Follow-up:%20${encodeURIComponent(inq.project?.title || "Software Solution")}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F3F7F7] hover:bg-[#E5EEEE] text-[#155761] border border-[#D9E2E4] text-xs font-semibold transition-colors">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </a>
                  </div>
                </div>

                {/* Message */}
                <div className="text-xs text-[#526267] bg-[#F8FAFA] p-4 rounded-xl border border-[#D9E2E4] leading-relaxed">
                  <p className="font-semibold text-[#102124] mb-1">Customer Message:</p>
                  <p className="whitespace-pre-line">{inq.message}</p>
                </div>

                {/* Footer: metadata + controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#526267]">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#155761]" />
                      <span>{inq.email}</span>
                    </div>
                    {inq.whatsapp && (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{inq.whatsapp}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(inq.createdAt)}</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* WhatsApp Replied quick toggle */}
                    {inq.status === "NEW" && inq.whatsapp && (
                      <label className="flex items-center gap-1.5 cursor-pointer select-none group">
                        <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                          isUpdating ? "bg-teal-100 border-teal-400" : "border-[#D9E2E4] group-hover:border-teal-400 bg-white"
                        }`}>
                          {isUpdating && <Loader2 className="w-2.5 h-2.5 text-teal-600 animate-spin" />}
                        </div>
                        <input
                          type="checkbox"
                          className="sr-only"
                          disabled={isUpdating}
                          onChange={() => updateStatus(inq.id, { whatsappReplied: true })}
                        />
                        <span className="text-xs text-[#526267] group-hover:text-[#102124] transition-colors font-medium">
                          Replied via WhatsApp
                        </span>
                      </label>
                    )}

                    {/* Status Dropdown */}
                    <div className="relative">
                      <select
                        disabled={isUpdating}
                        value={inq.status}
                        onChange={(e) => updateStatus(inq.id, { status: e.target.value as InquiryStatus })}
                        className="h-8 pl-3 pr-7 text-xs font-semibold rounded-xl border border-[#D9E2E4] bg-white text-[#102124] appearance-none cursor-pointer hover:border-[#155761]/50 focus:outline-none focus:border-[#155761] focus:ring-1 focus:ring-[#155761]/20 disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >
                        {ALL_STATUSES.map((s) => (
                          <option key={s} value={s}>{STATUS_META[s].label}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 text-[#526267] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
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
                <span className="text-[11px] font-medium text-[#526267] mr-1">Page {currentPage} of {totalPages}</span>
                <Button type="button" variant="outline" size="sm"
                  disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-xs h-8 gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-3.5 h-3.5" />Previous
                </Button>
                <Button type="button" variant="outline" size="sm"
                  disabled={currentPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="text-xs h-8 gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  Next<ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
