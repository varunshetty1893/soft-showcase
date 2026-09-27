// app/(customer)/my-inquiries/page.tsx
// Customer inquiries history page.
// Source of truth: docs/25-inquiry-system.md & docs/36-development-roadmap.md

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getCustomerInquiries } from "@/lib/db/queries/customer";
import { InquiryStatusBadge } from "@/components/customer/InquiryStatusBadge";
import { Button } from "@/components/ui/button";
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

  const inquiries = await getCustomerInquiries(session.user.id, session.user.email);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-950">
            Project Inquiries
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track inquiries you have sent to software providers.
          </p>
        </div>

        <Link href="/projects">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            Explore More Projects
          </Button>
        </Link>
      </div>

      {inquiries.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            No inquiries submitted yet
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Found a software project you are interested in? Inquire directly from any
            project detail page to discuss details and pricing with the verified builder.
          </p>
          <Link href="/projects">
            <Button variant="primary" size="md">
              Browse Available Projects
            </Button>
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
                className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:border-indigo-200 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  {/* Project Info */}
                  <div className="flex items-start gap-4">
                    {primaryImage ? (
                      <img
                        src={primaryImage}
                        alt={inquiry.project.title}
                        className="w-16 h-16 rounded-xl object-cover border border-gray-100 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center shrink-0">
                        <Store className="w-6 h-6 text-gray-400" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Link
                          href={`/projects/${inquiry.project.slug}`}
                          className="font-bold text-gray-900 hover:text-indigo-600 transition-colors text-base inline-flex items-center gap-1 group"
                        >
                          <span>{inquiry.project.title}</span>
                          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-indigo-600 transition-opacity" />
                        </Link>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Store className="w-3.5 h-3.5 text-gray-400" />
                          <span>Provider:</span>
                          <strong className="text-gray-700 font-medium">
                            {inquiry.provider.displayName}
                          </strong>
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>Submitted:</span>
                          <span className="text-gray-700">{formattedDate}</span>
                        </span>

                        <span className="flex items-center gap-1">
                          {inquiry.contactMethod === "WHATSAPP" ? (
                            <>
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-medium">WhatsApp</span>
                            </>
                          ) : (
                            <>
                              <Mail className="w-3.5 h-3.5 text-indigo-600" />
                              <span className="text-indigo-700 font-medium">Email</span>
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
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Your Message
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50/80 rounded-xl p-3.5 border border-gray-100 whitespace-pre-wrap leading-relaxed">
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
