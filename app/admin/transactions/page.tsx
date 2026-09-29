// app/admin/transactions/page.tsx
// Admin view of all partner transactions and payment proofs.

import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getAllTransactions } from "@/lib/db/queries/transactions";
import { Receipt } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Transaction Management — Admin — ${APP_NAME}`,
  robots: { index: false },
};

export default async function AdminTransactionsPage() {
  await requireAdmin(true);

  const transactions = await getAllTransactions();

  const verified = transactions.filter((t: any) => t.paymentStatus === "VERIFIED" || t.paymentStatus === "COMPLETED");
  const pending = transactions.filter((t: any) => t.paymentStatus === "PENDING" || t.paymentStatus === "EVIDENCE_SUBMITTED" || t.paymentStatus === "UNDER_REVIEW");

  return (
    <div className="space-y-8">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">
              Transactions &amp; Evidence Audit
            </h1>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Audit partner-recorded customer transactions, verify bank transfer UTRs, and approve evidence receipts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold">
            {verified.length} Verified
          </span>
          <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-xl font-bold">
            {pending.length} Pending Review
          </span>
        </div>
      </div>

      {/* ── Table Section ──────────────────────────────────────────────── */}
      {transactions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs space-y-2">
          <Receipt className="w-8 h-8 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">No Transactions Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Transactions recorded by Solution Partners will appear here for administrative verification.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Transaction / UTR</th>
                  <th className="py-3.5 px-4">Partner</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Solution / Scope</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Payment Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-mono font-bold text-gray-900">{tx.transactionNumber}</div>
                      <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                        UTR: {tx.utrNumber}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-gray-900">{tx.partner?.displayName || "Partner"}</div>
                      <div className="text-[10px] text-gray-400">{tx.partner?.email}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-semibold text-gray-900">{tx.customerName}</div>
                      <div className="text-[11px] text-gray-500">{tx.customerEmail}</div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="font-medium truncate max-w-[160px]">
                        {tx.solution?.title || tx.projectType.replace(/_/g, " ")}
                      </div>
                      <div className="text-[10px] text-gray-400 capitalize">
                        {tx.paymentMethod}
                      </div>
                    </td>

                    <td className="py-4 px-4 font-bold text-indigo-700">
                      {formatCurrency(Number(tx.amount))}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.paymentStatus === "VERIFIED" || tx.paymentStatus === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : tx.paymentStatus === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {tx.paymentStatus}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <Link href={`/admin/transactions/${tx.id}`} className={buttonVariants({ variant: "outline", size: "sm", className: "h-7 text-xs px-2.5" })}>
                          Audit &amp; Verify
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
