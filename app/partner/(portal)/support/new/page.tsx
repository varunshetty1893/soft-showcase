// app/partner/(portal)/support/new/page.tsx
// Open a new support ticket.

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SupportTicketForm } from "@/components/partner/SupportTicketForm";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Open Support Ticket — ${APP_NAME}`,
  robots: { index: false },
};

export default function NewPartnerSupportTicketPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#D9E2E4]">
        <div className="flex items-center gap-3">
          <Link
            href="/partner/support"
            className="p-2 rounded-xl bg-white border border-[#D9E2E4] hover:bg-[#F3F7F7] text-[#526267] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#102124]">Create Support Ticket</h1>
            <p className="text-xs text-[#526267]">
              Submit your technical, listing, or billing inquiry directly to platform administrators.
            </p>
          </div>
        </div>
      </div>

      <SupportTicketForm returnUrl="/partner/support" />
    </div>
  );
}
