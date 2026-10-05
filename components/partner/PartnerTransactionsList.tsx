"use client";

import * as React from "react";
import Link from "next/link";
import {
  Receipt,
  Plus,
  ArrowRight,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import { formatMoney } from "@/lib/utils/money";
import { paymentMethodLabel } from "@/lib/transactions/payments";

interface PartnerTransactionItem {
  id: string;
  transactionNumber: string;
  utrNumber?: string | null;
  agreedAmount?: number;
  verifiedTotal?: number;
  balance?: number;
  paymentCount?: number;
  customerName: string;
  customerEmail?: string | null;
  amount: string | number;
  paymentStatus: string;
  paymentMethod: string;
  transactionDate: string | Date;
  projectType?: string | null;
  solution?: {
    id: string;
    title: string;
    slug?: string;
  } | null;
}

interface PartnerTransactionsListProps {
  initialTransactions: PartnerTransactionItem[];
}

export function PartnerTransactionsList({
  initialTransactions,
}: PartnerTransactionsListProps) {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const verifiedCount = React.useMemo(
    () =>
      initialTransactions.filter(
        (t) => t.paymentStatus === "VERIFIED" || t.paymentStatus === "COMPLETED"
      ).length,
    [initialTransactions]
  );

  const pendingCount = React.useMemo(
    () =>
      initialTransactions.filter(
        (t) =>
          t.paymentStatus === "PENDING" ||
          t.paymentStatus === "EVIDENCE_SUBMITTED" ||
          t.paymentStatus === "UNDER_REVIEW"
      ).length,
    [initialTransactions]
  );

  const filteredTransactions = React.useMemo(() => {
    return initialTransactions.filter((tx) => {
      if (statusFilter === "VERIFIED") {
        if (tx.paymentStatus !== "VERIFIED" && tx.paymentStatus !== "COMPLETED") return false;
      } else if (statusFilter === "PENDING") {
        if (
          tx.paymentStatus !== "PENDING" &&
          tx.paymentStatus !== "EVIDENCE_SUBMITTED" &&
          tx.paymentStatus !== "UNDER_REVIEW"
        )
          return false;
      } else if (statusFilter === "REJECTED") {
        if (tx.paymentStatus !== "REJECTED") return false;
      }

      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTx = tx.transactionNumber.toLowerCase().includes(q);
        const matchesUtr = (tx.utrNumber || "").toLowerCase().includes(q);
        const matchesCustomer = tx.customerName.toLowerCase().includes(q);
        const matchesEmail = (tx.customerEmail || "").toLowerCase().includes(q);
        const matchesSolution = (tx.solution?.title || "").toLowerCase().includes(q);
        if (!matchesTx && !matchesUtr && !matchesCustomer && !matchesEmail && !matchesSolution) {
          return false;
        }
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

  if (initialTransactions.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-12 text-center shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#F3F7F7] text-[#155761] flex items-center justify-center mx-auto">
          <Receipt className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#102124]">No Transactions Recorded Yet</h3>
          <p className="text-xs text-[#526267] max-w-md mx-auto">
            When you close an engagement with a customer, record the transaction and upload payment evidence to get creator verification.
          </p>
        </div>
        <Link
          href="/partner/transactions/new"
          className={buttonVariants({
            variant: "primary",
            size: "sm",
            className: "gap-2",
          })}
        >
          <Plus className="w-4 h-4" />
          Record First Transaction
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Stats Overview ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
          <p className="text-xs text-[#526267] font-medium">Total Transactions</p>
          <p className="text-2xl font-bold text-[#102124] mt-1">{initialTransactions.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
          <p className="text-xs text-[#526267] font-medium">Verified &amp; Settled</p>
          <p className="text-2xl font-bold text-[#2F7D78] mt-1">{verifiedCount}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
          <p className="text-xs text-[#526267] font-medium">Under Review</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
        </div>
      </div>

      {/* ── Search Bar & Filter Tabs ────────────────────────────────────── */}
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
            placeholder="Search by transaction #, UTR, customer, or solution..."
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
            { label: "Verified", value: "VERIFIED" },
            { label: "Pending", value: "PENDING" },
            { label: "Rejected", value: "REJECTED" },
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

      {/* ── Transactions List ───────────────────────────────────────────── */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-10 text-center shadow-xs space-y-2">
          <Receipt className="w-8 h-8 text-[#526267] mx-auto opacity-50" />
          <h4 className="text-sm font-bold text-[#102124]">No Transactions Found</h4>
          <p className="text-xs text-[#526267] max-w-sm mx-auto">
            {search
              ? `No transactions match "${search}". Try a different keyword or UTR.`
              : `No transactions found under status "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedTransactions.map((tx) => {
            const isVerified = tx.paymentStatus === "VERIFIED" || tx.paymentStatus === "COMPLETED";
            const isRejected = tx.paymentStatus === "REJECTED";

            return (
              <div
                key={tx.id}
                className="bg-white rounded-2xl border border-[#D9E2E4] p-5 sm:p-6 shadow-xs space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3F7F7] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#155761]">
                        {tx.transactionNumber}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isVerified
                            ? "bg-[#DDF4EC] text-[#2F7D78] border border-[#2F7D78]/30"
                            : isRejected
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-900 border border-amber-300"
                        }`}
                      >
                        {tx.paymentStatus}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-[#102124] mt-1">
                      {tx.customerName}
                    </h3>
                    <p className="text-xs text-[#526267]">
                      Scope: <strong className="text-[#102124]">{tx.solution?.title || tx.projectType?.replace(/_/g, " ") || "Custom Solution"}</strong>
                    </p>
                  </div>

                  <div className="text-right sm:text-right">
                    <p className="text-lg font-extrabold text-[#102124]">
                      {formatMoney(tx.agreedAmount ?? Number(tx.amount))}
                    </p>
                    <p className="text-xs font-mono text-[#526267]">
                      {tx.utrNumber ? `UTR: ${tx.utrNumber}` : "No UTR (cash)"}
                    </p>
                  </div>
                </div>

                {/* Footer details */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#526267] pt-1">
                  <div className="flex items-center gap-4">
                    <span>Payment Mode: <strong>{paymentMethodLabel(tx.paymentMethod)}</strong></span>
                    <span>Date: <strong>{formatDate(tx.transactionDate)}</strong></span>
                  </div>

                  <Link
                    href={`/partner/transactions/${tx.id}`}
                    className="font-semibold text-[#155761] hover:underline flex items-center gap-1"
                  >
                    <span>View Evidence &amp; Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Pagination Footer */}
          {filteredTransactions.length > 0 && (
            <div className="p-4 rounded-2xl border border-[#D9E2E4] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#526267] shadow-xs">
              <div>
                Showing <span className="font-semibold text-[#102124]">{(currentPage - 1) * pageSize + 1}</span>–
                <span className="font-semibold text-[#102124]">{Math.min(currentPage * pageSize, filteredTransactions.length)}</span> of{" "}
                <span className="font-semibold text-[#102124]">{filteredTransactions.length}</span> transactions
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
