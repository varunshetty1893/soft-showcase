// app/admin/receipts/page.tsx
// Admin list of every issued (verified) payment receipt with issuer partner, filters and pagination.

import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { Receipt, Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import { formatDate } from "@/lib/utils/format";
import { formatMoney } from "@/lib/utils/money";
import { buildReceipts, paymentMethodLabel } from "@/lib/transactions/payments";
import { TablePagination } from "@/components/common/TablePagination";

export const metadata: Metadata = {
  title: `Receipts — Admin — ${APP_NAME}`,
  robots: { index: false },
};

const PAGE_SIZE = 20;

export default async function AdminReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; partner?: string; from?: string; to?: string }>;
}) {
  await requireAdmin(true);
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const q = (sp.q || "").trim();
  const partnerId = (sp.partner || "").trim();
  const from = sp.from ? new Date(sp.from) : null;
  const to = sp.to ? new Date(`${sp.to}T23:59:59.999Z`) : null;

  const where: any = { status: "VERIFIED" };
  if (partnerId) where.transaction = { ...(where.transaction ?? {}), partnerId };
  if (from && !isNaN(from.getTime())) where.verifiedAt = { ...(where.verifiedAt ?? {}), gte: from };
  if (to && !isNaN(to.getTime())) where.verifiedAt = { ...(where.verifiedAt ?? {}), lte: to };
  if (q) {
    where.OR = [
      { utrNumber: { contains: q, mode: "insensitive" } },
      { transaction: { transactionNumber: { contains: q, mode: "insensitive" } } },
      { transaction: { customerName: { contains: q, mode: "insensitive" } } },
      { transaction: { customerEmail: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [rows, total, partners] = await Promise.all([
    db.transactionPayment.findMany({
      where,
      include: {
        transaction: {
          include: {
            partner: { select: { id: true, displayName: true } },
            solution: { select: { title: true } },
            payments: { select: { id: true, sequence: true, amount: true, status: true } },
          },
        },
      },
      orderBy: { verifiedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.transactionPayment.count({ where }),
    db.projectProvider.findMany({ select: { id: true, displayName: true }, orderBy: { displayName: "asc" }, take: 500 }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">Receipts</h1>
          </div>
          <p className="mt-1 text-xs text-gray-500">Every receipt issued for a verified payment, with the partner who issued it.</p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 shadow-xs self-start sm:self-auto">
          {total} receipts
        </div>
      </div>

      <form method="GET" className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-end">
        <input name="q" defaultValue={q} placeholder="Search receipt, UTR, customer…" className="h-9 px-3 rounded-xl border border-gray-200 text-xs sm:w-64" />
        <select name="partner" defaultValue={partnerId} className="h-9 px-3 rounded-xl border border-gray-200 text-xs bg-white">
          <option value="">All partners</option>
          {partners.map((p: any) => (
            <option key={p.id} value={p.id}>{p.displayName}</option>
          ))}
        </select>
        <label className="text-[11px] text-gray-500 flex items-center gap-1">From <input type="date" name="from" defaultValue={sp.from || ""} className="h-9 px-2 rounded-xl border border-gray-200 text-xs" /></label>
        <label className="text-[11px] text-gray-500 flex items-center gap-1">To <input type="date" name="to" defaultValue={sp.to || ""} className="h-9 px-2 rounded-xl border border-gray-200 text-xs" /></label>
        <button type="submit" className={buttonVariants({ variant: "primary", size: "sm", className: "h-9" })}>Filter</button>
      </form>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs text-xs text-gray-500">
          No receipts found. Receipts appear here once a payment is verified.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Receipt</th>
                  <th className="py-3.5 px-4">Issued by</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Verified</th>
                  <th className="py-3.5 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {rows.map((p: any) => {
                  const tx = p.transaction;
                  const meta = buildReceipts(tx.transactionNumber, tx.payments, tx.agreedAmount ?? tx.amount).find((r) => r.paymentId === p.id);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/50">
                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-gray-900">{meta?.receiptNumber ?? `${tx.transactionNumber}-R${p.sequence}`}</div>
                        {meta?.isFinal && <span className="text-[10px] font-bold text-emerald-700">Paid in Full</span>}
                        <div className="text-[10px] text-gray-400">{paymentMethodLabel(p.paymentMethod)}{p.utrNumber ? ` • ${p.utrNumber}` : ""}</div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-900">{tx.partner?.displayName ?? "Partner"}</td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">{tx.customerName}</div>
                        <div className="text-[11px] text-gray-500">{tx.solution?.title ?? tx.projectType.replace(/_/g, " ")}</div>
                      </td>
                      <td className="py-4 px-4 font-bold text-indigo-700">{formatMoney(Number(p.amount.toString()), p.currency)}</td>
                      <td className="py-4 px-4">{p.verifiedAt ? formatDate(p.verifiedAt) : "—"}</td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/transactions/${tx.id}`} className="text-indigo-600 hover:underline font-semibold">Order</Link>
                          <a href={`/receipts/${p.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-semibold">
                            <Download className="w-3 h-3" /> Receipt
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <TablePagination currentPage={page} totalPages={totalPages} totalItems={total} pageSize={PAGE_SIZE} itemName="receipts" />
        </div>
      )}
    </div>
  );
}
