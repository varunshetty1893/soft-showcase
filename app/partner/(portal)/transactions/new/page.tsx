// app/partner/(portal)/transactions/new/page.tsx
// Record new transaction and submit payment evidence.

import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import { ArrowLeft } from "lucide-react";
import { TransactionForm } from "@/components/partner/TransactionForm";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Record Transaction — ${APP_NAME}`,
  robots: { index: false },
};

export default async function NewPartnerTransactionPage() {
  const { partner } = await getEffectivePartnerContext();
  const partnerId = partner.id;

  const solutions = await db.project.findMany({
    where: { providerId: partnerId },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#D9E2E4]">
        <div className="flex items-center gap-3">
          <Link
            href="/partner/transactions"
            className="p-2 rounded-xl bg-white border border-[#D9E2E4] hover:bg-[#F3F7F7] text-[#526267] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#102124]">Record Solution Transaction</h1>
            <p className="text-xs text-[#526267]">
              Submit customer transaction details, UTR reference, and payment evidence for review.
            </p>
          </div>
        </div>
      </div>

      <TransactionForm solutions={solutions} />
    </div>
  );
}
