// app/admin/transactions/[id]/page.tsx
// Admin transaction audit detail page.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { AdminTransactionDetailManager } from "@/components/admin/AdminTransactionDetailManager";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Transaction Audit — Admin — ${APP_NAME}`,
  robots: { index: false },
};

export default async function AdminTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.isAdmin) return null;

  const { id } = await params;

  const transaction = await db.transaction.findUnique({
    where: { id },
    include: {
      partner: true,
      solution: true,
      customer: true,
    },
  });

  if (!transaction) {
    notFound();
  }

  return <AdminTransactionDetailManager transaction={transaction} />;
}
