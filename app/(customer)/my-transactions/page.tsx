// app/(customer)/my-transactions/page.tsx
// Customer view of orders, purchases, payment verification status, and delivery milestones.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getCustomerTransactions } from "@/lib/db/queries/transactions";
import {
  Receipt,
  MessageCircle,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `My Orders & Transactions — ${APP_NAME}`,
  robots: { index: false },
};

export default async function CustomerTransactionsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/my-transactions");
  }

  const transactions = await getCustomerTransactions(
    session.user.id,
    session.user.email || ""
  );

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

      {transactions.length === 0 ? (
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
        <div className="space-y-4">
          {transactions.map((tx: any) => (
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
        </div>
      )}
    </div>
  );
}
