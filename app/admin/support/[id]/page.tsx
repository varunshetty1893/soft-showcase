// app/admin/support/[id]/page.tsx
// Admin support ticket detail & conversation manager.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { AdminSupportDetailManager } from "@/components/admin/AdminSupportDetailManager";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Ticket Details — Admin — ${APP_NAME}`,
  robots: { index: false },
};

export default async function AdminTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.isAdmin) return null;

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

  return (
    <AdminSupportDetailManager
      ticket={ticket}
      currentUserId={session.user.id}
    />
  );
}
