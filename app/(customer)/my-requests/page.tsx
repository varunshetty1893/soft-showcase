// app/(customer)/my-requests/page.tsx
// Customer custom project requests history page.
// Source of truth: docs/26-custom-project-system.md & docs/36-development-roadmap.md

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getCustomerRequests } from "@/lib/db/queries/customer";
import { RequestStatusBadge } from "@/components/customer/RequestStatusBadge";
import { buttonVariants } from "@/components/ui/button";
import {
  FileCode2,
  PlusCircle,
  Calendar,
  Wallet,
  Sparkles,
  Tag,
  Code2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "My Custom Requests — Soft Showcase",
  description: "Track the review and development status of your custom software project requests.",
};

export default async function MyRequestsPage() {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.email) {
    redirect("/login");
  }

  const requests = await getCustomerRequests(session.user.email);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#102124]">
            Custom Project Requests
          </h2>
          <p className="text-sm text-[#526267] mt-1">
            Track bespoke software requests submitted to the Soft Showcase engineering team.
          </p>
        </div>

        <Link href="/custom-project" className={buttonVariants({ variant: "primary", size: "sm", className: "gap-1.5 text-xs shadow-xs" })}>
            <PlusCircle className="w-3.5 h-3.5" />
            New Custom Request
          </Link>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#102124] mb-1">
            No custom software requests yet
          </h3>
          <p className="text-sm text-[#526267] max-w-md mx-auto mb-6">
            Need a completely tailored web app, mobile application, or backend service?
            Submit your project scope and our architectural review team will evaluate it.
          </p>
          <Link href="/custom-project" className={buttonVariants({ variant: "primary", size: "md" })}>
              Request Custom Software
            </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {requests.map((req) => {
            const formattedDate = new Date(req.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-7 shadow-xs hover:border-[#155761]/40 transition-colors"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#102124] flex items-center gap-2">
                      <FileCode2 className="w-5 h-5 text-[#155761] shrink-0" />
                      <span>{req.projectTitle}</span>
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#526267] mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#526267]" />
                        <span>Submitted on {formattedDate}</span>
                      </span>

                      {req.category && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#F3F7F7] border border-[#D9E2E4] text-[#102124] font-medium">
                          <Tag className="w-3 h-3 text-[#526267]" />
                          {req.category}
                        </span>
                      )}

                      {req.budget && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#DDF4EC] text-[#2F7D78] font-medium border border-[#2F7D78]/25">
                          <Wallet className="w-3 h-3 text-[#2F7D78]" />
                          Budget: {req.budget}
                        </span>
                      )}

                      {req.deadline && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-medium border border-amber-200">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          Target: {req.deadline}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <RequestStatusBadge status={req.status} />
                  </div>
                </div>

                {/* Tech Preferences if any */}
                {req.technologyPreferences && req.technologyPreferences.length > 0 && (
                  <div className="mb-4 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#526267] flex items-center gap-1 mr-1">
                      <Code2 className="w-3.5 h-3.5" />
                      Preferred Tech:
                    </span>
                    {req.technologyPreferences.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded-md text-xs bg-[#F3F7F7] border border-[#D9E2E4] text-[#102124] font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description & Features Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#F3F7F7]">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#526267] mb-2">
                      Scope Description
                    </h4>
                    <p className="text-sm text-[#102124] bg-[#F8FAFA] rounded-xl p-3.5 border border-[#D9E2E4] leading-relaxed whitespace-pre-wrap">
                      {req.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#526267] mb-2">
                      Must-Have Features
                    </h4>
                    <p className="text-sm text-[#102124] bg-[#F8FAFA] rounded-xl p-3.5 border border-[#D9E2E4] leading-relaxed whitespace-pre-wrap">
                      {req.requiredFeatures}
                    </p>
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
