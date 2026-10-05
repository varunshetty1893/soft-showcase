// app/partner/(portal)/transactions/[id]/page.tsx
// Partner transaction detail and verification review.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import {
  ArrowLeft,
  Receipt,
  User,
} from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { formatMoney } from "@/lib/utils/money";
import { summarizeTransaction } from "@/lib/transactions/summary";
import { PaymentsTable } from "@/components/transactions/PaymentsTable";
import { AddPaymentForm } from "@/components/partner/AddPaymentForm";
import { MAX_ACTIVE_PAYMENTS } from "@/lib/transactions/payments";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Transaction Details — ${APP_NAME}`,
  robots: { index: false },
};

export default async function PartnerTransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { partner, user } = await getEffectivePartnerContext();

  const { id } = await params;

  const transaction = await db.transaction.findUnique({
    where: { id },
    include: {
      solution: true,
      customer: true,
      partner: true,
      payments: { orderBy: { sequence: "asc" } },
    },
  });

  if (!transaction) {
    notFound();
  }

  // Verify the record belongs to the logged-in partner unless the user is admin
  if (transaction.partnerId !== partner.id && !user.isAdmin) {
    notFound();
  }

  const summary = summarizeTransaction(transaction);
  const locked = ["REFUNDED", "DISPUTED", "COMPLETED"].includes(transaction.paymentStatus);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-[#D9E2E4]">
        <div className="flex items-center gap-3">
          <Link
            href="/partner/transactions"
            className="p-2 rounded-xl bg-white border border-[#D9E2E4] hover:bg-[#F3F7F7] text-[#526267] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#102124]">
                Transaction {transaction.transactionNumber}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  transaction.paymentStatus === "VERIFIED" || transaction.paymentStatus === "COMPLETED"
                    ? "bg-[#DDF4EC] text-[#2F7D78] border border-[#2F7D78]/30"
                    : transaction.paymentStatus === "REJECTED"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-900 border border-amber-300"
                }`}
              >
                {transaction.paymentStatus}
              </span>
            </div>
            <p className="text-xs text-[#526267] font-mono mt-0.5">
              {transaction.utrNumber ? `UTR: ${transaction.utrNumber}` : "No UTR (cash)"} • {formatDate(transaction.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Summary */}
        <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#155761]" />
            <span>Payment Summary</span>
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-[#F3F7F7]">
              <span className="text-[#526267]">Total deal amount:</span>
              <strong className="text-base text-[#155761]">
                {formatMoney(summary.agreedAmount, transaction.currency)}
              </strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F3F7F7]">
              <span className="text-[#526267]">Paid &amp; verified:</span>
              <span className="font-semibold">{formatMoney(summary.verifiedTotal, transaction.currency)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F3F7F7]">
              <span className="text-[#526267]">Balance:</span>
              <span className={`font-bold ${summary.balance > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                {summary.balance > 0 ? formatMoney(summary.balance, transaction.currency) : "Nil — paid in full"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F3F7F7]">
              <span className="text-[#526267]">Payments:</span>
              <span className="font-semibold">{summary.activeCount} of {MAX_ACTIVE_PAYMENTS}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F3F7F7]">
              <span className="text-[#526267]">Delivery Status:</span>
              <span className="font-semibold text-[#102124]">{transaction.deliveryStatus}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#526267]">Transaction Date:</span>
              <span>{formatDate(transaction.transactionDate)}</span>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-[#155761]" />
            <span>Client &amp; Scope</span>
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-[#F3F7F7]">
              <span className="text-[#526267]">Customer Name:</span>
              <span className="font-bold">{transaction.customerName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F3F7F7]">
              <span className="text-[#526267]">Customer Email:</span>
              <span className="font-mono">{transaction.customerEmail}</span>
            </div>
            {transaction.customerWhatsapp && (
              <div className="flex justify-between py-1 border-b border-[#F3F7F7]">
                <span className="text-[#526267]">WhatsApp:</span>
                <span className="font-mono text-emerald-600">{transaction.customerWhatsapp}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-[#F3F7F7]">
              <span className="text-[#526267]">Scope Type:</span>
              <span>{transaction.projectType.replace(/_/g, " ")}</span>
            </div>
            {transaction.solution && (
              <div className="flex justify-between py-1">
                <span className="text-[#526267]">Solution:</span>
                <Link
                  href={`/projects/${transaction.solution.slug}`}
                  target="_blank"
                  className="text-[#155761] hover:underline font-semibold"
                >
                  {transaction.solution.title}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payments, screenshots & receipts */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-[#102124]">Payments, Screenshots &amp; Receipts</h3>
        <PaymentsTable payments={summary.payments} currency={transaction.currency} />
        {!locked && (
          <AddPaymentForm
            transactionId={transaction.id}
            slotsLeft={summary.slotsLeft}
            remainingToSubmit={summary.remainingToSubmit}
            currency={transaction.currency}
          />
        )}
      </div>

      {/* Scope description notes */}
      {transaction.description && (
        <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 shadow-xs space-y-2 text-xs">
          <h3 className="font-bold text-[#102124]">Scope &amp; Delivery Details</h3>
          <p className="text-[#526267] leading-relaxed whitespace-pre-line">
            {transaction.description}
          </p>
        </div>
      )}

      {/* Admin Notes if any */}
      {transaction.adminNotes && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 text-xs text-amber-900 space-y-1">
          <p className="font-bold">Administrative Verification Note:</p>
          <p className="leading-relaxed">{transaction.adminNotes}</p>
        </div>
      )}
    </div>
  );
}
