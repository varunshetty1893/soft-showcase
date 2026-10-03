// app/(customer)/my-requests/page.tsx
// Customer custom project requests history page with search and pagination.
// Source of truth: docs/26-custom-project-system.md & docs/36-development-roadmap.md

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getCustomerRequests } from "@/lib/db/queries/customer";
import { buttonVariants } from "@/components/ui/button";
import { PlusCircle, Sparkles } from "lucide-react";
import { CustomerRequestsList } from "@/components/customer/CustomerRequestsList";

export const metadata: Metadata = {
  title: "My Custom Requests — Soft Showcase",
  description: "Track the review and development status of your custom software project requests.",
};

export default async function MyRequestsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const rawRequests = await getCustomerRequests(session.user.id);

  const serializedRequests = rawRequests.map((req: any) => ({
    id: req.id,
    projectTitle: req.projectTitle,
    category: req.category,
    budget: req.budget,
    deadline: req.deadline,
    description: req.description,
    requiredFeatures: req.requiredFeatures,
    technologyPreferences: req.technologyPreferences,
    status: req.status,
    createdAt: req.createdAt instanceof Date ? req.createdAt.toISOString() : req.createdAt,
  }));

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

      {serializedRequests.length === 0 ? (
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
        <CustomerRequestsList initialRequests={serializedRequests} />
      )}
    </div>
  );
}
