// app/(customer)/my-transactions/page.tsx
// Customer view of orders, purchases, payment verification status, and delivery milestones with search and pagination.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getCustomerTransactions } from "@/lib/db/queries/transactions";
import { Receipt } from "lucide-react";
import { summarizeTransaction } from "@/lib/transactions/summary";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import { CustomerTransactionsList } from "@/components/customer/CustomerTransactionsList";

export const metadata: Metadata = {
  title: `My Orders & Transactions — ${APP_NAME}`,
  robots: { index: false },
};

export default async function CustomerTransactionsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/my-transactions");
  }

  const rawTransactions = await getCustomerTransactions(
    session.user.id,
    session.user.email || ""
  );

  const serializedTransactions = rawTransactions.map((tx: any) => ({
    id: tx.id,
    transactionNumber: tx.transactionNumber,
    utrNumber: tx.utrNumber,
    amount: tx.amount?.toString?.() ?? tx.amount,
    summary: (() => {
      const sm = summarizeTransaction(tx);
      return {
        agreedAmount: sm.agreedAmount,
        verifiedTotal: sm.verifiedTotal,
        balance: sm.balance,
        isFullyPaid: sm.isFullyPaid,
        payments: sm.payments.map((p) => ({
          id: p.id,
          sequence: p.sequence,
          amount: p.amount,
          paymentMethod: p.paymentMethod,
          status: p.status,
          paidAt: p.paidAt,
          receiptNumber: p.receiptNumber,
          isFinalReceipt: p.isFinalReceipt,
        })),
      };
    })(),
    paymentStatus: tx.paymentStatus,
    deliveryStatus: tx.deliveryStatus,
    projectType: tx.projectType,
    paymentMethod: tx.paymentMethod,
    description: tx.description,
    createdAt: tx.createdAt instanceof Date ? tx.createdAt.toISOString() : tx.createdAt,
    solution: tx.solution
      ? {
          id: tx.solution.id,
          title: tx.solution.title,
          slug: tx.solution.slug,
        }
      : null,
    partner: tx.partner
      ? {
          id: tx.partner.id,
          displayName: tx.partner.displayName,
          email: tx.partner.email,
          whatsappNumber: tx.partner.whatsappNumber,
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9E2E4]">
        <div>
          <h2 className="text-xl font-bold text-[#102124]">My Orders &amp; Transactions</h2>
          <p className="text-xs text-[#526267] mt-0.5">
            Review your software purchase records, bank transfer verification status, and delivery handover milestones.
          </p>
        </div>
      </div>

      {serializedTransactions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#D9E2E4] p-12 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F3F7F7] text-[#155761] flex items-center justify-center mx-auto">
            <Receipt className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#102124]">No Orders On Record</h3>
            <p className="text-xs text-[#526267] max-w-md mx-auto">
              When you purchase a software solution from a Solution Partner or place a custom order, verified transaction receipts will appear here.
            </p>
          </div>
          <Link href="/projects" className={buttonVariants({ variant: "primary", size: "sm" })}>
            Browse Solutions Catalog
          </Link>
        </div>
      ) : (
        <CustomerTransactionsList initialTransactions={serializedTransactions} />
      )}
    </div>
  );
}
