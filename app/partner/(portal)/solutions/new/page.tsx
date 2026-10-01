// app/partner/(portal)/solutions/new/page.tsx
// Add new software solution.

import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import { ArrowLeft } from "lucide-react";
import { PartnerSolutionForm } from "@/components/partner/PartnerSolutionForm";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Add Software Solution — ${APP_NAME}`,
  robots: { index: false },
};

export default async function NewPartnerSolutionPage() {
  await getEffectivePartnerContext();

  const [categories, technologies] = await Promise.all([
    db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.technology.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#D9E2E4]">
        <div className="flex items-center gap-3">
          <Link
            href="/partner/solutions"
            className="p-2 rounded-xl bg-white border border-[#D9E2E4] hover:bg-[#F3F7F7] text-[#526267] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#102124]">Add Software Solution</h1>
            <p className="text-xs text-[#526267]">
              Publish a production-ready application, custom boilerplate, or turnkey engine.
            </p>
          </div>
        </div>

        <Link
          href="/partner/solutions/import"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#BEDEE1] bg-white hover:bg-[#F3F7F7] text-xs font-semibold text-[#155761] transition-colors shadow-2xs"
        >
          <span>Import via JSON</span>
        </Link>
      </div>

      <PartnerSolutionForm
        categories={categories}
        technologies={technologies}
        isEditing={false}
      />
    </div>
  );
}
