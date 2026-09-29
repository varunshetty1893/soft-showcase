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
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  User,
  Layers,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
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
  await getEffectivePartnerContext();

  const { id } = await params;

  const transaction = await db.transaction.findUnique({
    where: { id },
    include: {
      solution: true,
      customer: true,
      partner: true,
    },
  });

  if (!transaction) {
    notFound();
  }

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
              UTR: {transaction.utrNumber} • {formatDate(transaction.createdAt)}
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
              <span className="text-[#526267]">Amount:</span>
              <strong className="text-base text-[#155761]">
                {formatCurrency(Number(transaction.amount))}
              </strong>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F3F7F7]">
              <span className="text-[#526267]">Payment Mode:</span>
              <span className="font-semibold">{transaction.paymentMethod}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#F3F7F7]">
              <span className="text-[#526267]">UTR / Reference:</span>
              <span className="font-mono font-bold text-[#102124]">{transaction.utrNumber}</span>
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

      {/* Payment Evidence Screenshot Card */}
      {transaction.paymentEvidenceUrl && (
        <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#102124]">Submitted Payment Evidence</h3>
            <a
              href={transaction.paymentEvidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-[#155761] hover:underline flex items-center gap-1"
            >
              <span>Open in new tab</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="rounded-2xl border border-[#D9E2E4] overflow-hidden max-h-96 bg-[#102124]/5 flex items-center justify-center p-4">
            <img
              src={transaction.paymentEvidenceUrl}
              alt="Payment Proof"
              className="max-h-80 object-contain rounded-xl"
            />
          </div>
        </div>
      )}

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
