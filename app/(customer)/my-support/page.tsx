// app/(customer)/my-support/page.tsx
// Customer support tickets list and help desk.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getUserSupportTickets } from "@/lib/db/queries/support";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import {
  Headphones,
  Plus,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Help & Support Tickets — ${APP_NAME}`,
  robots: { index: false },
};

export default async function CustomerSupportPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/my-support");
  }

  const tickets = await getUserSupportTickets(session.user.id);

  return (
    <div className="min-h-screen bg-[#F8FAFA] py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <CustomerHeader user={session.user} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9E2E4]">
          <div>
            <h2 className="text-xl font-bold text-[#102124]">Help &amp; Support Tickets</h2>
            <p className="text-xs text-[#526267] mt-0.5">
              Direct assistance with platform administrators for order disputes, project queries, or account support.
            </p>
          </div>

          <Link href="/my-support/new" className={buttonVariants({ variant: "primary", size: "sm", className: "gap-2 font-bold shadow-xs" })}>
              <Plus className="w-4 h-4" />
              Open Support Ticket
            </Link>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#D9E2E4] p-12 text-center shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F3F7F7] text-[#155761] flex items-center justify-center mx-auto">
              <Headphones className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#102124]">No Support Tickets Opened</h3>
              <p className="text-xs text-[#526267] max-w-md mx-auto">
                Have a question about a software purchase, custom scope, or need technical help? Open a support ticket anytime.
              </p>
            </div>
            <Link href="/my-support/new" className={buttonVariants({ variant: "primary", size: "sm", className: "gap-2" })}>
                <Plus className="w-4 h-4" />
                Open Support Ticket
              </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t: any) => (
              <Link
                key={t.id}
                href={`/my-support/${t.id}`}
                className="block bg-white rounded-2xl border border-[#D9E2E4] p-5 shadow-xs hover:border-[#155761] transition-all hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#155761]">
                        {t.ticketNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === "RESOLVED" || t.status === "CLOSED"
                            ? "bg-[#DDF4EC] text-[#2F7D78]"
                            : t.status === "IN_PROGRESS"
                            ? "bg-sky-100 text-sky-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {t.status}
                      </span>
                      <span className="text-[10px] text-[#526267] font-semibold bg-[#F3F7F7] px-2 py-0.5 rounded">
                        {t.category}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-[#102124]">{t.subject}</h3>
                    <p className="text-xs text-[#526267] line-clamp-1">{t.description}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[#526267] shrink-0">
                    <span className="flex items-center gap-1 font-semibold text-[#155761]">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {t._count?.messages ?? 0} messages
                    </span>
                    <span className="text-[11px] font-mono">
                      {formatDate(t.updatedAt)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#526267]" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
