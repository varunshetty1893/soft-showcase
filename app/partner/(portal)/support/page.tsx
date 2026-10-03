// app/partner/(portal)/support/page.tsx
// Partner support tickets desk with search and pagination.

import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import { Headphones, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import { PartnerSupportList } from "@/components/partner/PartnerSupportList";

export const metadata: Metadata = {
  title: `Partner Support Desk — ${APP_NAME}`,
  robots: { index: false },
};

export default async function PartnerSupportPage() {
  const { user } = await getEffectivePartnerContext();

  const rawTickets = await db.supportTicket.findMany({
    where: { requesterId: user.id },
    include: {
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const serializedTickets = rawTickets.map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    subject: t.subject,
    description: t.description,
    category: t.category,
    status: t.status,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
    _count: {
      messages: t._count?.messages || 0,
    },
  }));

  return (
    <div className="space-y-6">
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

      {/* ── Searchable & Paginated Tickets List ────────────────────────── */}
      <PartnerSupportList initialTickets={serializedTickets} />
    </div>
  );
}
