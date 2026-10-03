// app/(customer)/my-support/page.tsx
// Customer support tickets list and help desk with search and pagination.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getUserSupportTickets } from "@/lib/db/queries/support";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";
import {
  CustomerSupportList,
  type CustomerSupportTicketItem,
} from "@/components/customer/CustomerSupportList";

export const metadata: Metadata = {
  title: `Help & Support Tickets — ${APP_NAME}`,
  robots: { index: false },
};

export default async function CustomerSupportPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/my-support");
  }

  const rawTickets = await getUserSupportTickets(session.user.id);

  const serializedTickets: CustomerSupportTicketItem[] = rawTickets.map((t: any) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    subject: t.subject,
    description: t.description,
    category: t.category,
    status: t.status,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
    _count: t._count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9E2E4]">
        <div>
          <h2 className="text-xl font-bold text-[#102124]">Help &amp; Support Tickets</h2>
          <p className="text-xs text-[#526267] mt-0.5">
            Direct assistance with platform administrators for order disputes, project queries, or account support.
          </p>
        </div>

        <Link
          href="/my-support/new"
          className={buttonVariants({
            variant: "primary",
            size: "sm",
            className: "gap-2 font-bold shadow-xs",
          })}
        >
          <Plus className="w-4 h-4" />
          Open Support Ticket
        </Link>
      </div>

      <CustomerSupportList initialTickets={serializedTickets} />
    </div>
  );
}
