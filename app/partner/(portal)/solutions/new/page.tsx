// app/partner/(portal)/solutions/new/page.tsx
// Add new software solution with prominent JSON import.

import type { Metadata } from "next";
import Link from "next/link";
import { db, ensureAdditiveSchema } from "@/lib/db/client";
import { ensureDefaultCategories } from "@/lib/db/queries/admin-projects";
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
  await ensureAdditiveSchema();

  const [categories, technologies] = await Promise.all([
    ensureDefaultCategories(),
    db.technology.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-4 border-b border-[#D9E2E4] gap-4 flex-wrap">
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
      </div>

      <PartnerSolutionForm
        categories={categories}
        technologies={technologies}
        isEditing={false}
      />
    </div>
  );
}
