// app/partner/page.tsx
// Solution Partner Dashboard overview.

import type { Metadata } from "next";
import Link from "next/link";
import { getPartnerDashboardStats } from "@/lib/db/queries/partner";
import {
  Layers,
  Users,
  Receipt,
  Headphones,
  Plus,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import { formatCurrency } from "@/lib/utils/format";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Partner Dashboard — ${APP_NAME}`,
  robots: { index: false },
};

export default async function PartnerDashboardPage() {
  const { user, partner } = await getEffectivePartnerContext();
  const partnerId = partner.id;
  const stats = await getPartnerDashboardStats(partnerId, user.id);

  return (
    <div className="space-y-8">
      {/* ── Welcome Banner ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DDF4EC] text-[#2F7D78] text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Active Partner Account</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#102124] tracking-tight">
            Welcome back, {partner?.displayName || user.name || "Partner Studio"}!
          </h1>
          <p className="text-xs sm:text-sm text-[#526267] max-w-xl">
            Here is your software solutions overview, inbound form enquiries, and transaction records submitted for review.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/partner/solutions/new" className={buttonVariants({ variant: "primary", size: "sm", className: "gap-1.5 font-bold shadow-xs" })}>
              <Plus className="w-4 h-4" />
              <span>Add Solution</span>
            </Link>
          <Link href="/partner/transactions/new" className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 font-semibold" })}>
              <Receipt className="w-4 h-4 text-[#155761]" />
              <span>Record Transaction</span>
            </Link>
        </div>
      </div>

      {/* ── Metric Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Solutions */}
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#526267]">
            <span>Software Solutions</span>
            <div className="w-8 h-8 rounded-lg bg-[#F3F7F7] text-[#155761] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#102124]">
            {stats.solutions.total}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#526267]">
            <span className="text-[#2F7D78] font-semibold">{stats.solutions.published} Published</span>
            <span>•</span>
            <span>{stats.solutions.draft} Drafts</span>
          </div>
        </div>

        {/* Customer Enquiries */}
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#526267]">
            <span>Customer Enquiries</span>
            <div className="w-8 h-8 rounded-lg bg-[#DDF4EC] text-[#2F7D78] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#102124]">
            {stats.inquiries.total}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#526267]">
            <span className="text-amber-700 font-semibold">{stats.inquiries.new} New Inbound</span>
            <span>•</span>
            <Link href="/partner/inquiries" className="text-[#155761] hover:underline">
              View all
            </Link>
          </div>
        </div>

        {/* Verified Transactions */}
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#526267]">
            <span>Verified Transactions</span>
            <div className="w-8 h-8 rounded-lg bg-[#F3F7F7] text-[#155761] flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#102124]">
            {stats.transactions.verified}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#526267]">
            <span className="text-amber-700 font-semibold">{stats.transactions.pending} Pending Review</span>
          </div>
        </div>

        {/* Transaction Volume */}
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#526267]">
            <span>Verified Volume</span>
            <div className="w-8 h-8 rounded-lg bg-[#DDF4EC] text-[#2F7D78] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#102124]">
            {formatCurrency(stats.transactions.totalVolume)}
          </div>
          <div className="text-xs text-[#526267]">
            Recorded across {stats.transactions.total} transaction entries
          </div>
        </div>
      </div>

      {/* ── Two Column: Inquiries & Transactions ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Inquiries */}
        <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F3F7F7] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#102124]">Recent Customer Enquiries</h2>
              <p className="text-xs text-[#526267]">Prospective buyers interested in your solutions</p>
            </div>
            <Link
              href="/partner/inquiries"
              className="text-xs font-semibold text-[#155761] hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.inquiries.total === 0 ? (
              <div className="py-8 text-center text-xs text-[#526267]">
                No customer enquiries received yet. Published solutions will appear in the catalog.
              </div>
            ) : (
              <div className="divide-y divide-[#F3F7F7]">
                <div className="py-3 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#102124]">Inbound Project Lead</p>
                    <p className="text-[11px] text-[#526267]">Interested in custom deployment</p>
                  </div>
                  <Link href="/partner/inquiries" className={buttonVariants({ variant: "outline", size: "sm", className: "h-7 text-xs px-2.5" })}>
                      Open Enquiry
                    </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions & Evidence */}
        <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F3F7F7] pb-4">
            <div>
              <h2 className="text-base font-bold text-[#102124]">Recent Transactions</h2>
              <p className="text-xs text-[#526267]">Partner-submitted payment evidence and transaction records</p>
            </div>
            <Link
              href="/partner/transactions"
              className="text-xs font-semibold text-[#155761] hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats.transactions.total === 0 ? (
              <div className="py-8 text-center text-xs text-[#526267] space-y-3">
                <p>No transaction records submitted yet.</p>
                <Link href="/partner/transactions/new" className={buttonVariants({ variant: "outline", size: "sm", className: "text-xs" })}>
                    Record First Transaction
                  </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.transactions.recent.map((tx: any) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-[#F8FAFA] border border-[#D9E2E4] flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#102124]">{tx.customerName}</span>
                        <span className="font-mono text-[10px] text-[#526267]">UTR: {tx.utrNumber}</span>
                      </div>
                      <p className="text-[11px] text-[#526267] mt-0.5">
                        {tx.projectType.replace(/_/g, " ")} • {formatCurrency(Number(tx.amount))}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.paymentStatus === "VERIFIED"
                            ? "bg-[#DDF4EC] text-[#2F7D78]"
                            : tx.paymentStatus === "REJECTED"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {tx.paymentStatus}
                      </span>
                      <Link href={`/partner/transactions/${tx.id}`} className={buttonVariants({ variant: "ghost", size: "sm", className: "h-7 px-2 text-xs" })}>
                          Details
                        </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Support Desk Card ───────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] flex items-center justify-center shrink-0">
            <Headphones className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[#102124]">
              Partner Help &amp; Support Desk
            </h3>
            <p className="text-xs text-[#526267]">
              Need help listing your project, verifying a payment, or updating bank details?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/partner/support" className={buttonVariants({ variant: "outline", size: "sm", className: "text-xs" })}>
              View Tickets ({stats.supportTickets.open} Open)
            </Link>
          <Link href="/partner/support/new" className={buttonVariants({ variant: "primary", size: "sm", className: "text-xs gap-1.5" })}>
              <Plus className="w-3.5 h-3.5" />
              <span>Create Ticket</span>
            </Link>
        </div>
      </div>
    </div>
  );
}
