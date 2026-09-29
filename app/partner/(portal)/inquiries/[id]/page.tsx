// app/partner/(portal)/inquiries/[id]/page.tsx
// Partner Customer Enquiry detail and response page.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import {
  ArrowLeft,
  Users,
  Mail,
  MessageCircle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Enquiry Details — Partner Portal — ${APP_NAME}`,
  robots: { index: false },
};

export default async function PartnerInquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { partner } = await getEffectivePartnerContext();

  const inquiry = await db.inquiry.findUnique({
    where: { id },
    include: {
      project: true,
      user: true,
    },
  });

  if (!inquiry) {
    notFound();
  }

  const cleanWhatsapp = (inquiry.whatsapp || "").replace(/[^0-9]/g, "");

  return (
    <div className="space-y-8 max-w-4xl">
      {/* ── Page Header / Breadcrumb ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9E2E4]">
        <div className="flex items-center gap-3">
          <Link
            href="/partner/inquiries"
            className="p-2 rounded-xl bg-white border border-[#D9E2E4] hover:bg-[#F3F7F7] text-[#526267] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#526267] uppercase tracking-wider">
                Customer Enquiry
              </span>
              <span className="text-[#D9E2E4]">•</span>
              <Badge
                variant={inquiry.status === "RESOLVED" ? "success" : "secondary"}
                className="text-[10px]"
              >
                {inquiry.status}
              </Badge>
            </div>
            <h1 className="text-2xl font-extrabold text-[#102124] tracking-tight">
              {inquiry.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {cleanWhatsapp && (
            <a
              href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                `Hello ${inquiry.name}, thank you for reaching out via Soft Showcase regarding "${inquiry.project?.title || "our software solutions"}".`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bold shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Reply on WhatsApp</span>
            </a>
          )}
          {inquiry.email && (
            <a
              href={`mailto:${inquiry.email}?subject=${encodeURIComponent(
                `Soft Showcase Enquiry: ${inquiry.project?.title || "Custom Solution"}`
              )}`}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#D9E2E4] bg-white hover:bg-[#F3F7F7] text-xs font-bold text-[#155761] shadow-xs transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span>Send Email</span>
            </a>
          )}
        </div>
      </div>

      {/* ── Enquiry Details ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Inbound Message */}
          <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-[#102124] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#155761]" />
              <span>Inquiry Message</span>
            </h2>
            <div className="p-4 rounded-2xl bg-[#F8FAFA] border border-[#D9E2E4] text-sm text-[#102124] leading-relaxed whitespace-pre-line">
              {inquiry.message}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#526267] pt-2">
              <Clock className="w-3.5 h-3.5 text-[#526267]" />
              <span>Received on {formatDate(inquiry.createdAt)}</span>
            </div>
          </div>

          {/* Solution Referenced */}
          {inquiry.project && (
            <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 space-y-3 shadow-xs">
              <span className="text-xs font-bold text-[#526267] uppercase tracking-wider block">
                Target Solution
              </span>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base text-[#102124]">
                    {inquiry.project.title}
                  </h3>
                  <p className="text-xs text-[#526267] mt-0.5 line-clamp-1">
                    {inquiry.project.shortDescription}
                  </p>
                </div>
                <Link
                  href={`/partner/solutions/${inquiry.project.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9E2E4] bg-white hover:bg-[#F3F7F7] text-xs font-semibold text-[#155761] shrink-0"
                >
                  <span>View Details</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Client Contact Profile */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 space-y-4 shadow-xs">
            <h3 className="text-sm font-bold text-[#102124]">Prospective Client</h3>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#526267] block">Full Name</span>
                <span className="font-bold text-[#102124] text-sm">{inquiry.name}</span>
              </div>
              <div>
                <span className="text-[#526267] block">Email</span>
                <span className="font-mono text-[#102124]">{inquiry.email || "Not provided"}</span>
              </div>
              <div>
                <span className="text-[#526267] block">WhatsApp / Phone</span>
                <span className="font-mono text-[#102124]">{inquiry.whatsapp || "Not provided"}</span>
              </div>
              <div>
                <span className="text-[#526267] block">Status</span>
                <Badge variant={inquiry.status === "RESOLVED" ? "success" : "secondary"}>
                  {inquiry.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-[#155761] text-white rounded-3xl p-6 space-y-3 shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2F7D78]" />
              <h3 className="text-sm font-bold">Fast Direct Response</h3>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Buyers on Soft Showcase appreciate fast replies. Reach out via WhatsApp or email directly to close the engagement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
