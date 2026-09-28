// app/partner/transactions/page.tsx
// Partner transactions list and settlement history.

import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { getPartnerTransactions } from "@/lib/db/queries/partner";
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
  const session = await auth();
  if (!session?.user) return null;

  let partner = null;
  try {
    partner = await db.projectProvider.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || "" },
        ],
      },
    });
  } catch (err) {
    console.warn("Could not find partner:", err);
  }

  const partnerId = partner?.id || "prov-varun";
  const transactions = await getPartnerTransactions(partnerId);

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
              Transactions &amp; Payment Evidence
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#526267]">
            Record customer purchases, submit bank transfer/UPI UTR numbers &amp; payment receipts for platform verification.
          </p>
        </div>

        <Link href="/partner/transactions/new">
          <Button variant="primary" size="sm" className="gap-2 shadow-xs font-bold">
            <Plus className="w-4 h-4" />
            Record Transaction
          </Button>
        </Link>
      </div>

      {/* ── Overview Metrics ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
          <p className="text-xs text-[#526267] font-medium">Total Transactions</p>
          <p className="text-2xl font-bold text-[#102124] mt-1">{transactions.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
          <p className="text-xs text-[#526267] font-medium">Verified Payments</p>
          <p className="text-2xl font-bold text-[#2F7D78] mt-1">{verified.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
          <p className="text-xs text-[#526267] font-medium">Under Review / Pending</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">{pending.length}</p>
        </div>
      </div>

      {/* ── Transactions Table ─────────────────────────────────────────── */}
      {transactions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#D9E2E4] p-12 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F3F7F7] text-[#155761] flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#102124]">No Transactions Recorded</h3>
            <p className="text-xs text-[#526267] max-w-md mx-auto">
              When a customer completes a software purchase, customized order, or upfront payment, record the transaction here to receive verified badge and delivery tracking.
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
        <div className="bg-white rounded-2xl border border-[#D9E2E4] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFA] border-b border-[#D9E2E4] font-semibold text-[#526267] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Transaction / UTR</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Solution / Scope</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4">Delivery</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F7F7] text-[#102124]">
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-[#F8FAFA]/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-[#102124]">{tx.transactionNumber}</div>
                      <div className="text-[11px] text-[#526267] font-mono mt-0.5">
                        UTR: {tx.utrNumber}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold">{tx.customerName}</div>
                      <div className="text-[11px] text-[#526267]">{tx.customerEmail}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium truncate max-w-[180px]">
                        {tx.solution?.title || tx.projectType.replace(/_/g, " ")}
                      </div>
                      <div className="text-[10px] text-[#526267] capitalize">
                        {tx.paymentMethod}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-[#155761]">
                      {formatCurrency(Number(tx.amount))}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.paymentStatus === "VERIFIED" || tx.paymentStatus === "COMPLETED"
                            ? "bg-[#DDF4EC] text-[#2F7D78] border border-[#2F7D78]/30"
                            : tx.paymentStatus === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-900 border border-amber-300"
                        }`}
                      >
                        {tx.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-semibold text-[#526267]">
                        {tx.deliveryStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link href={`/partner/transactions/${tx.id}`}>
                        <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
