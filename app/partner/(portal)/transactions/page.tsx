// app/partner/(portal)/transactions/page.tsx
// Partner transactions list and settlement history with search and pagination.

import type { Metadata } from "next";
import Link from "next/link";
import { getPartnerTransactions } from "@/lib/db/queries/partner";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import { Receipt, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import { summarizeTransaction } from "@/lib/transactions/summary";
import { PartnerTransactionsList } from "@/components/partner/PartnerTransactionsList";

export const metadata: Metadata = {
  title: `Transactions & Evidence — ${APP_NAME}`,
  robots: { index: false },
};

export default async function PartnerTransactionsPage() {
  const { partner } = await getEffectivePartnerContext();

  const partnerId = partner.id;
  const rawTransactions = await getPartnerTransactions(partnerId);

  const serializedTransactions = rawTransactions.map((tx: any) => {
    const sm = summarizeTransaction(tx);
    return {
    agreedAmount: sm.agreedAmount,
    verifiedTotal: sm.verifiedTotal,
    balance: sm.balance,
    paymentCount: sm.activeCount,
    id: tx.id,
    transactionNumber: tx.transactionNumber,
    utrNumber: tx.utrNumber,
    customerName: tx.customerName,
    customerEmail: tx.customerEmail,
    amount: tx.amount ? tx.amount.toString() : 0,
    paymentStatus: tx.paymentStatus,
    paymentMethod: tx.paymentMethod,
    transactionDate: tx.transactionDate instanceof Date ? tx.transactionDate.toISOString() : tx.transactionDate,
    projectType: tx.projectType,
    solution: tx.solution
      ? {
          id: tx.solution.id,
          title: tx.solution.title,
          slug: tx.solution.slug,
        }
      : null,
  };
  });

  return (
    <div className="space-y-6">
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

        <Link
          href="/partner/transactions/new"
          className={buttonVariants({
            variant: "primary",
            size: "sm",
            className: "gap-2 shadow-xs font-bold",
          })}
        >
          <Plus className="w-4 h-4" />
          Record Transaction
        </Link>
      </div>

      {/* ── Searchable & Paginated Transactions List ───────────────────── */}
      <PartnerTransactionsList initialTransactions={serializedTransactions} />
    </div>
  );
}
