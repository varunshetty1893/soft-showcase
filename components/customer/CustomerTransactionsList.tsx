"use client";

import * as React from "react";
import Link from "next/link";
import {
  Receipt,
  MessageCircle,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils/format";

interface CustomerTransactionItem {
  id: string;
  transactionNumber: string;
  utrNumber?: string | null;
  amount: string | number;
  paymentStatus: string;
  deliveryStatus: string;
  projectType: string;
  paymentMethod: string;
  description?: string | null;
  createdAt: string | Date;
  solution?: {
    id: string;
    title: string;
    slug?: string;
  } | null;
  partner?: {
    id: string;
    displayName: string;
    email?: string | null;
    whatsappNumber?: string | null;
  } | null;
}

interface CustomerTransactionsListProps {
  initialTransactions: CustomerTransactionItem[];
}

export function CustomerTransactionsList({
  initialTransactions,
}: CustomerTransactionsListProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const filteredTransactions = React.useMemo(() => {
    return initialTransactions.filter((tx) => {
      const isVerified = tx.paymentStatus === "VERIFIED" || tx.paymentStatus === "COMPLETED";
      if (statusFilter === "VERIFIED" && !isVerified) return false;
      if (statusFilter === "PENDING" && isVerified) return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTx = tx.transactionNumber.toLowerCase().includes(q);
        const matchesUtr = (tx.utrNumber || "").toLowerCase().includes(q);
        const matchesSolution = (tx.solution?.title || "").toLowerCase().includes(q);
        const matchesPartner = (tx.partner?.displayName || "").toLowerCase().includes(q);
        if (!matchesTx && !matchesUtr && !matchesSolution && !matchesPartner) return false;
      }
      return true;
    });
  }, [initialTransactions, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedTransactions = filteredTransactions.slice(
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
            placeholder="Search by transaction #, UTR, solution, or partner..."
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
            { label: "All Orders", value: "ALL" },
            { label: "Verified", value: "VERIFIED" },
            { label: "Pending", value: "PENDING" },
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

      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-10 text-center shadow-xs space-y-2">
          <Receipt className="w-8 h-8 text-[#526267] mx-auto opacity-50" />
          <h4 className="text-sm font-bold text-[#102124]">No Orders Found</h4>
          <p className="text-xs text-[#526267] max-w-sm mx-auto">
            {search
              ? `No transactions match "${search}". Try searching with a different term.`
              : `No transactions found under "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedTransactions.map((tx) => (
            <div
              key={tx.id}
              className="bg-white rounded-2xl border border-[#D9E2E4] p-5 sm:p-6 shadow-xs space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3F7F7] pb-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#155761]">
                      {tx.transactionNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.paymentStatus === "VERIFIED" || tx.paymentStatus === "COMPLETED"
                          ? "bg-[#DDF4EC] text-[#2F7D78] border border-[#2F7D78]/30"
                          : tx.paymentStatus === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-900 border border-amber-300"
                      }`}
                    >
                      Payment {tx.paymentStatus}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#F3F7F7] text-[#526267]">
                      Delivery: {tx.deliveryStatus}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#102124] pt-1">
                    {tx.solution?.title || tx.projectType.replace(/_/g, " ")}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-lg font-extrabold text-[#155761]">
                    {formatCurrency(Number(tx.amount))}
                  </div>
                  {tx.utrNumber ? (
                    <div className="text-[11px] text-[#526267] font-mono">
                      UTR: {tx.utrNumber}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-[#526267]">
                    <strong>Solution Partner:</strong> {tx.partner?.displayName}
                  </p>
                  {tx.partner?.email ? (
                    <p className="text-[#526267]">
                      <strong>Contact:</strong> {tx.partner.email}
                    </p>
                  ) : null}
                  {tx.partner?.whatsappNumber && (
                    <a
                      href={`https://wa.me/${tx.partner.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Hi ${tx.partner.displayName}, I have a question regarding transaction ${tx.transactionNumber}.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-semibold mt-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat with Partner on WhatsApp</span>
                    </a>
                  )}
                </div>

                <div className="space-y-1">
                  <p className="text-[#526267]">
                    <strong>Scope:</strong> {tx.projectType.replace(/_/g, " ")}
                  </p>
                  <p className="text-[#526267]">
                    <strong>Payment Mode:</strong> {tx.paymentMethod}
                  </p>
                  <p className="text-[#526267]">
                    <strong>Order Date:</strong> {formatDate(tx.createdAt)}
                  </p>
                </div>
              </div>

              {tx.description && (
                <div className="p-3 bg-[#F8FAFA] rounded-xl border border-[#D9E2E4] text-xs text-[#526267]">
                  <strong className="text-[#102124]">Delivery / Handover Notes:</strong>
                  <p className="mt-0.5 leading-relaxed">{tx.description}</p>
                </div>
              )}
            </div>
          ))}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 rounded-2xl border border-[#D9E2E4] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#526267] shadow-xs">
              <div>
                Showing <span className="font-semibold text-[#102124]">{(currentPage - 1) * pageSize + 1}</span>–
                <span className="font-semibold text-[#102124]">{Math.min(currentPage * pageSize, filteredTransactions.length)}</span> of{" "}
                <span className="font-semibold text-[#102124]">{filteredTransactions.length}</span> orders
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-[#526267] mr-1">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="text-xs h-8 gap-1 cursor-pointer"
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
                  className="text-xs h-8 gap-1 cursor-pointer"
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
