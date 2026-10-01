// app/partner/(portal)/solutions/new/page.tsx
// Add new software solution with prominent JSON import.

import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db/client";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import { ArrowLeft, FileCode, Sparkles, ArrowRight } from "lucide-react";
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

        {/* High-visibility primary import button in header */}
        <Link
          href="/partner/solutions/import"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#155761] hover:bg-[#0E3E45] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
        >
          <FileCode className="w-4 h-4 text-emerald-300" />
          <span>Import via JSON</span>
          <ArrowRight className="w-3.5 h-3.5 opacity-80" />
        </Link>
      </div>

      {/* ── High-Visibility Full-Width Import Banner ───────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0E3E45] via-[#155761] to-[#1E6B77] p-5 sm:p-6 text-white shadow-md border border-[#155761]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 text-emerald-300">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold tracking-tight">
                  Have Project Details in JSON?
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-emerald-400 text-emerald-950">
                  Recommended
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-2xl leading-relaxed">
                Skip typing every field manually! Paste your project specification or AI JSON to automatically populate title, description, features, tech stack, specifications, and FAQs in 1 click.
              </p>
            </div>
          </div>

          <Link
            href="/partner/solutions/import"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-emerald-50 text-[#0E3E45] text-xs sm:text-sm font-extrabold shadow-lg hover:shadow-xl transition-all shrink-0 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Launch JSON Importer</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
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
