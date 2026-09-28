// app/partner/support/[id]/page.tsx
// View partner ticket details and message thread.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { ArrowLeft, Headphones, Shield, User, Clock } from "lucide-react";
import { SupportThreadViewer } from "@/components/partner/SupportThreadViewer";
import { formatDate } from "@/lib/utils/format";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Ticket Details — ${APP_NAME}`,
  robots: { index: false },
};

export default async function PartnerTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const { id } = await params;

  const ticket = await db.supportTicket.findUnique({
    where: { id },
    include: {
      requester: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) {
    notFound();
  }

  // Ensure security: either requester or admin can view
  if (ticket.requesterId !== session.user.id && !session.user.isAdmin) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-[#D9E2E4]">
        <div className="flex items-center gap-3">
          <Link
            href="/partner/support"
            className="p-2 rounded-xl bg-white border border-[#D9E2E4] hover:bg-[#F3F7F7] text-[#526267] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#155761]">
                {ticket.ticketNumber}
              </span>
              <h1 className="text-xl font-bold text-[#102124]">{ticket.subject}</h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  ticket.status === "RESOLVED" || ticket.status === "CLOSED"
                    ? "bg-[#DDF4EC] text-[#2F7D78]"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {ticket.status}
              </span>
            </div>
            <p className="text-xs text-[#526267] mt-0.5">
              Category: <strong>{ticket.category}</strong> • Priority: <strong>{ticket.priority}</strong>
            </p>
          </div>
        </div>
      </div>

      <SupportThreadViewer
        ticketId={ticket.id}
        initialMessages={ticket.messages}
        currentUserId={session.user.id}
        ticketStatus={ticket.status}
        isAdminView={false}
      />
    </div>
  );
}
