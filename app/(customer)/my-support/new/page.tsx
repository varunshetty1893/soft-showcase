// app/(customer)/my-support/new/page.tsx
// Open support ticket for customers.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { ArrowLeft } from "lucide-react";
import { SupportTicketForm } from "@/components/partner/SupportTicketForm";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Open Support Ticket — ${APP_NAME}`,
  robots: { index: false },
};

export default async function CustomerNewSupportPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/my-support/new");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#D9E2E4]">
        <div className="flex items-center gap-3">
          <Link
            href="/my-support"
            className="p-2 rounded-xl bg-white border border-[#D9E2E4] hover:bg-[#F3F7F7] text-[#526267] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-[#102124]">Create Support Ticket</h2>
            <p className="text-xs text-[#526267]">
              Submit your project, order, or technical question directly to platform support.
            </p>
          </div>
        </div>
      </div>

      <SupportTicketForm returnUrl="/my-support" />
    </div>
  );
}
