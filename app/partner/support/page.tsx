// app/partner/support/page.tsx
// Partner support tickets desk.

import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import {
  Headphones,
  Plus,
  MessageSquare,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Partner Support Desk — ${APP_NAME}`,
  robots: { index: false },
};

export default async function PartnerSupportPage() {
  const session = await auth();
  if (!session?.user) return null;

  const tickets = await db.supportTicket.findMany({
    where: { requesterId: session.user.id },
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

        <Link href="/partner/support/new">
          <Button variant="primary" size="sm" className="gap-2 shadow-xs font-bold">
            <Plus className="w-4 h-4" />
            Create Support Ticket
          </Button>
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
              If you have inquiries regarding solution reviews, payments, or account changes, open a ticket anytime.
            </p>
          </div>
          <Link href="/partner/support/new">
            <Button variant="primary" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Open Your First Ticket
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket: any) => (
            <Link
              key={ticket.id}
              href={`/partner/support/${ticket.id}`}
              className="block bg-white rounded-2xl border border-[#D9E2E4] p-5 shadow-xs hover:border-[#155761] transition-all hover:shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#155761]">
                      {ticket.ticketNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ticket.status === "RESOLVED" || ticket.status === "CLOSED"
                          ? "bg-[#DDF4EC] text-[#2F7D78]"
                          : ticket.status === "IN_PROGRESS"
                          ? "bg-sky-100 text-sky-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {ticket.status}
                    </span>
                    <span className="text-[10px] text-[#526267] font-semibold bg-[#F3F7F7] px-2 py-0.5 rounded">
                      {ticket.category}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-[#102124]">{ticket.subject}</h3>
                  <p className="text-xs text-[#526267] line-clamp-1">{ticket.description}</p>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#526267] shrink-0">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-[#155761]" />
                    {ticket._count?.messages ?? 0} messages
                  </span>
                  <span className="text-[11px] font-mono">
                    {formatDate(ticket.updatedAt)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#526267]" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
