// app/(customer)/my-requests/page.tsx
// Customer custom project requests history page.
// Source of truth: docs/26-custom-project-system.md & docs/36-development-roadmap.md

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getCustomerRequests } from "@/lib/db/queries/customer";
import { RequestStatusBadge } from "@/components/customer/RequestStatusBadge";
import { Button } from "@/components/ui/button";
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
          <h2 className="text-xl font-bold tracking-tight text-gray-950">
            Custom Project Requests
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Track bespoke software requests submitted to the Soft Showcase engineering team.
          </p>
        </div>

        <Link href="/custom-project">
          <Button variant="primary" size="sm" className="gap-1.5 text-xs shadow-sm">
            <PlusCircle className="w-3.5 h-3.5" />
            New Custom Request
          </Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            No custom software requests yet
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            Need a completely tailored web app, mobile application, or backend service?
            Submit your project scope and our architectural review team will evaluate it.
          </p>
          <Link href="/custom-project">
            <Button variant="primary" size="md">
              Request Custom Software
            </Button>
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
                className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-7 shadow-sm hover:border-indigo-200 transition-colors"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                      <FileCode2 className="w-5 h-5 text-indigo-600 shrink-0" />
                      <span>{req.projectTitle}</span>
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Submitted on {formattedDate}</span>
                      </span>

                      {req.category && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium">
                          <Tag className="w-3 h-3 text-gray-500" />
                          {req.category}
                        </span>
                      )}

                      {req.budget && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-medium border border-emerald-100">
                          <Wallet className="w-3 h-3 text-emerald-600" />
                          Budget: {req.budget}
                        </span>
                      )}

                      {req.deadline && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-medium border border-amber-100">
                          <Calendar className="w-3 h-3 text-amber-600" />
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
                    <span className="text-xs font-semibold text-gray-400 flex items-center gap-1 mr-1">
                      <Code2 className="w-3.5 h-3.5" />
                      Preferred Tech:
                    </span>
                    {req.technologyPreferences.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-700 font-medium"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description & Features Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Scope Description
                    </h4>
                    <p className="text-sm text-gray-700 bg-gray-50/80 rounded-xl p-3.5 border border-gray-100 leading-relaxed whitespace-pre-wrap">
                      {req.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                      Must-Have Features
                    </h4>
                    <p className="text-sm text-gray-700 bg-gray-50/80 rounded-xl p-3.5 border border-gray-100 leading-relaxed whitespace-pre-wrap">
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
