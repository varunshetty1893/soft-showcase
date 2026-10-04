// app/partner/inquiries/page.tsx
// Partner customer enquiries dashboard with search and pagination.

import type { Metadata } from "next";
import { getPartnerInquiries } from "@/lib/db/queries/partner";
import { Users } from "lucide-react";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import { APP_NAME } from "@/config/constants";
import { PartnerInquiriesList } from "@/components/partner/PartnerInquiriesList";

export const metadata: Metadata = {
  title: `Customer Enquiries — ${APP_NAME}`,
  robots: { index: false },
};

export default async function PartnerInquiriesPage() {
  const { partner } = await getEffectivePartnerContext();
  const partnerId = partner.id;
  const rawInquiries = await getPartnerInquiries(partnerId);

  const serializedInquiries = rawInquiries.map((inq: any) => ({
    id: inq.id,
    name: inq.name,
    email: inq.email,
    whatsapp: inq.whatsapp || null,
    message: inq.message,
    status: inq.status,
    createdAt: inq.createdAt instanceof Date ? inq.createdAt.toISOString() : inq.createdAt,
    project: inq.project
      ? {
          id: inq.project.id,
          title: inq.project.title,
          slug: inq.project.slug,
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D9E2E4]">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#155761]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#102124]">
              Customer Enquiries
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#526267]">
            Form inquiries from prospective buyers regarding your listed solutions or custom scopes. Direct WhatsApp chats are not recorded here.
          </p>
        </div>

        <div className="text-xs font-semibold text-[#526267] bg-white px-3 py-1.5 rounded-xl border border-[#D9E2E4] shadow-xs">
          Total Enquiries: <span className="text-[#102124] font-bold">{serializedInquiries.length}</span>
        </div>
      </div>

      {/* ── Searchable & Paginated Inquiries List ──────────────────────── */}
      <PartnerInquiriesList initialInquiries={serializedInquiries} />
    </div>
  );
}
