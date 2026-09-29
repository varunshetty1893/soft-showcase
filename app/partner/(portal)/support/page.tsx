// app/partner/(portal)/support/page.tsx
// Partner support tickets desk.

import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import {
  Headphones,
  Plus,
  MessageSquare,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Partner Support Desk — ${APP_NAME}`,
  robots: { index: false },
};

export default async function PartnerSupportPage() {
  const { user } = await getEffectivePartnerContext();

  const tickets = await db.supportTicket.findMany({
    where: { requesterId: user.id },
    include: {
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D9E2E4]">
        <div>
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-[#155761]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#102124]">
              Partner Support Desk
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#526267]">
            Direct technical and administrative assistance with platform operators regarding solution listings, settlements, or buyer verifications.
          </p>
        </div>

        <Link href="/partner/support/new" className={buttonVariants({ variant: "primary", size: "sm", className: "gap-2 shadow-xs font-bold" })}>
            <Plus className="w-4 h-4" />
            Create Support Ticket
          </Link>
      </div>

      {/* ── Tickets List ───────────────────────────────────────────────── */}
      {tickets.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#D9E2E4] p-12 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F3F7F7] text-[#155761] flex items-center justify-center mx-auto">
            <Headphones className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#102124]">No Support Tickets</h3>
            <p className="text-xs text-[#526267] max-w-md mx-auto">
              Need assistance with your Solution Partner profile, listing review, or payment verification? Open a ticket below.
            </p>
          </div>
          <Link href="/partner/support/new" className={buttonVariants({ variant: "primary", size: "sm", className: "gap-2" })}>
              <Plus className="w-4 h-4" />
              Open New Ticket
            </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket: any) => {
            const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED";

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-2xl border border-[#D9E2E4] p-5 sm:p-6 shadow-xs space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F3F7F7] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#155761]">
                      {ticket.ticketNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isResolved
                          ? "bg-[#DDF4EC] text-[#2F7D78]"
                          : ticket.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-900"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {ticket.status}
                    </span>
                    <span className="text-[11px] text-[#526267] font-semibold">
                      {ticket.category}
                    </span>
                  </div>

                  <span className="text-xs text-[#526267] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(ticket.createdAt)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div>
                    <h3 className="font-bold text-base text-[#102124]">
                      {ticket.subject}
                    </h3>
                    <p className="text-xs text-[#526267] mt-1 line-clamp-2 leading-relaxed">
                      {ticket.description}
                    </p>
                  </div>

                  <Link href={`/partner/support/${ticket.id}`} className={buttonVariants({ variant: "outline", size: "sm", className: "shrink-0 gap-1.5 text-xs" })}>
                      <span>View Thread</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
