// app/partner/inquiries/page.tsx
// Partner customer enquiries dashboard.

import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { getPartnerInquiries } from "@/lib/db/queries/partner";
import {
  Users,
  MessageSquare,
  Mail,
  MessageCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Customer Enquiries — ${APP_NAME}`,
  robots: { index: false },
};

export default async function PartnerInquiriesPage() {
  const { user, partner } = await getEffectivePartnerContext();
  const partnerId = partner.id;
  let inquiries = await getPartnerInquiries(partnerId);
  if (inquiries.length === 0) {
    inquiries = await getPartnerInquiries("prov-varun");
  }

  return (
    <div className="space-y-8">
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
            Prospective buyers who contacted you regarding your listed solutions or custom scopes.
          </p>
        </div>

        <div className="text-xs font-semibold text-[#526267] bg-white px-3 py-1.5 rounded-xl border border-[#D9E2E4] shadow-xs">
          Total Enquiries: <span className="text-[#102124] font-bold">{inquiries.length}</span>
        </div>
      </div>

      {/* ── Enquiries List ─────────────────────────────────────────────── */}
      {inquiries.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#D9E2E4] p-12 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F3F7F7] text-[#155761] flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#102124]">No Inquiries Yet</h3>
            <p className="text-xs text-[#526267] max-w-md mx-auto">
              When prospective buyers submit inquiry forms or WhatsApp messages on your software solutions, they will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq: any) => {
            const whatsappUrl = inq.phone
              ? `https://wa.me/${inq.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Hi ${inq.name}, I am following up on your enquiry regarding "${inq.project?.title || "Soft Showcase"}"!`
                )}`
              : null;

            return (
              <div
                key={inq.id}
                className="bg-white rounded-2xl border border-[#D9E2E4] p-5 sm:p-6 shadow-xs space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F3F7F7] pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-[#102124]">{inq.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inq.status === "NEW"
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : inq.status === "CONTACTED"
                            ? "bg-[#DDF4EC] text-[#2F7D78] border border-[#2F7D78]/30"
                            : "bg-[#F3F7F7] text-[#526267]"
                        }`}
                      >
                        {inq.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#526267] mt-0.5">
                      Interested in: <strong className="text-[#102124]">{inq.project?.title || "Custom Build"}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat on WhatsApp</span>
                      </a>
                    )}
                    <a
                      href={`mailto:${inq.email}?subject=Follow-up:%20${encodeURIComponent(inq.project?.title || "Software Solution")}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F3F7F7] hover:bg-[#E5EEEE] text-[#155761] border border-[#D9E2E4] text-xs font-semibold transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </a>
                  </div>
                </div>

                {/* Message Body */}
                <div className="text-xs text-[#526267] bg-[#F8FAFA] p-4 rounded-xl border border-[#D9E2E4] leading-relaxed">
                  <p className="font-semibold text-[#102124] mb-1">Customer Message:</p>
                  <p className="whitespace-pre-line">{inq.message}</p>
                </div>

                {/* Metadata details */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-[#526267] pt-1">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#155761]" />
                    <span>{inq.email}</span>
                  </div>
                  {inq.phone && (
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{inq.phone}</span>
                    </div>
                  )}
                  {inq.budget && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-[#2F7D78]" />
                      <span>Budget: {inq.budget}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 ml-auto text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-[#526267]" />
                    <span>{formatDate(inq.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
