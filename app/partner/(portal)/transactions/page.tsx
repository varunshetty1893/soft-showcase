// app/partner/(portal)/transactions/page.tsx
// Partner transactions list and settlement history.

import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { getPartnerTransactions } from "@/lib/db/queries/partner";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import {
  Receipt,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Transactions & Evidence — ${APP_NAME}`,
  robots: { index: false },
};

export default async function PartnerTransactionsPage() {
  const { user, partner } = await getEffectivePartnerContext();

  const partnerId = partner?.id || "prov-varun";
  let transactions = await getPartnerTransactions(partnerId);
  if (transactions.length === 0) {
    transactions = await getPartnerTransactions("prov-varun");
  }

  const verified = transactions.filter((t) => t.paymentStatus === "VERIFIED" || t.paymentStatus === "COMPLETED");
  const pending = transactions.filter((t) => t.paymentStatus === "PENDING" || t.paymentStatus === "EVIDENCE_SUBMITTED" || t.paymentStatus === "UNDER_REVIEW");

  return (
    <div className="space-y-8">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D9E2E4]">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#155761]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#102124]">
              Transactions &amp; Evidence
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#526267]">
            Recorded customer transactions, submitted UTR numbers, payment proofs, and administrative verification status.
          </p>
        </div>

        <Link href="/partner/transactions/new">
          <Button variant="primary" size="sm" className="gap-2 shadow-xs font-bold">
            <Plus className="w-4 h-4" />
            Record Transaction
          </Button>
        </Link>
      </div>

      {/* ── Stats Overview ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
          <p className="text-xs text-[#526267] font-medium">Total Transactions</p>
          <p className="text-2xl font-bold text-[#102124] mt-1">{transactions.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
          <p className="text-xs text-[#526267] font-medium">Verified &amp; Settled</p>
          <p className="text-2xl font-bold text-[#2F7D78] mt-1">{verified.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
          <p className="text-xs text-[#526267] font-medium">Under Review</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{pending.length}</p>
        </div>
      </div>

      {/* ── Transactions List ───────────────────────────────────────────── */}
      {transactions.length === 0 ? (
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
          <Link href="/partner/transactions/new">
            <Button variant="primary" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Record First Transaction
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((tx: any) => {
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
                      {formatCurrency(Number(tx.amount))}
                    </p>
                    <p className="text-xs font-mono text-[#526267]">
                      UTR: {tx.utrNumber}
                    </p>
                  </div>
                </div>

                {/* Footer details */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#526267] pt-1">
                  <div className="flex items-center gap-4">
                    <span>Payment Mode: <strong>{tx.paymentMethod}</strong></span>
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
        </div>
      )}
    </div>
  );
}
