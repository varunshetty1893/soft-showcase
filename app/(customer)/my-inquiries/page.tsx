// app/(customer)/my-inquiries/page.tsx
// Customer inquiries history page.
// Source of truth: docs/25-inquiry-system.md & docs/36-development-roadmap.md

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getCustomerInquiries } from "@/lib/db/queries/customer";
import { InquiryStatusBadge } from "@/components/customer/InquiryStatusBadge";
import { buttonVariants } from "@/components/ui/button";
import {
  MessageSquare,
  ArrowUpRight,
  Clock,
  Mail,
  Phone,
  Store,
  Layers,
} from "lucide-react";

export const metadata: Metadata = {
  title: "My Inquiries — Soft Showcase",
  description: "Track your project inquiries and provider correspondence.",
};

export default async function MyInquiriesPage() {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.email) {
    redirect("/login");
  }

  const inquiries = await getCustomerInquiries(session.user.id);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#102124]">
            Project Inquiries
          </h2>
          <p className="text-sm text-[#526267] mt-1">
            Track inquiries you have sent to software providers.
          </p>
        </div>

        <Link href="/projects" className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 text-xs" })}>
            <Layers className="w-3.5 h-3.5 text-[#155761]" />
            Explore More Projects
          </Link>
      </div>

      {inquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#102124] mb-1">
            No inquiries submitted yet
          </h3>
          <p className="text-sm text-[#526267] max-w-md mx-auto mb-6">
            Found a software project you are interested in? Inquire directly from any
            project detail page to discuss details and pricing with the verified builder.
          </p>
          <Link href="/projects" className={buttonVariants({ variant: "primary", size: "md" })}>
              Browse Available Projects
            </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => {
            const formattedDate = new Date(inquiry.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            const primaryImage = inquiry.project.images?.[0]?.url;

            return (
              <div
                key={inquiry.id}
                className="bg-white rounded-2xl border border-[#D9E2E4] p-6 shadow-xs hover:border-[#155761]/40 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  {/* Project Info */}
                  <div className="flex items-start gap-4">
                    {primaryImage ? (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#D9E2E4] shrink-0">
                        <Image
                          src={primaryImage}
                          alt={inquiry.project.title}
                          fill
                          sizes="64px"
                          unoptimized={primaryImage.startsWith("data:")}
                          referrerPolicy="no-referrer"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-[#F8FAFA] text-[#526267] border border-[#D9E2E4] flex items-center justify-center shrink-0">
                        <Store className="w-6 h-6 text-[#526267]" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/projects/${inquiry.project.slug}`}
                          className="font-bold text-[#102124] hover:text-[#155761] transition-colors text-base inline-flex items-center gap-1 group"
                        >
                          <span>{inquiry.project.title}</span>
                          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-[#155761] transition-opacity" />
                        </Link>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#526267]">
                        <span className="flex items-center gap-1">
                          <Store className="w-3.5 h-3.5 text-[#526267]" />
                          <span>Provider:</span>
                          <strong className="text-[#102124] font-medium">
                            {inquiry.provider.displayName}
                          </strong>
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#526267]" />
                          <span>Submitted:</span>
                          <span className="text-[#102124]">{formattedDate}</span>
                        </span>

                        <span className="flex items-center gap-1">
                          {inquiry.contactMethod === "WHATSAPP" ? (
                            <>
                              <Phone className="w-3.5 h-3.5 text-[#2F7D78]" />
                              <span className="text-[#2F7D78] font-medium">WhatsApp</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5 text-[#155761]" />
                              <span className="text-[#155761] font-medium">Email</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    <InquiryStatusBadge status={inquiry.status} />
                  </div>
                </div>

                {/* Inquiry Message Details */}
                <div className="mt-4 pt-4 border-t border-[#F3F7F7]">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#526267] mb-1.5">
                    Your Message
                  </div>
                  <p className="text-sm text-[#102124] bg-[#F8FAFA] rounded-xl p-3.5 border border-[#D9E2E4] whitespace-pre-wrap leading-relaxed">
                    {inquiry.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
