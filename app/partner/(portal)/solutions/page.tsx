// app/partner/solutions/page.tsx
// Solution Partner - My Solutions list with instant featured toggle and JSON import.

import type { Metadata } from "next";
import Link from "next/link";
import { getPartnerProjects } from "@/lib/db/queries/partner";
import { Plus, Layers, FileCode, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import { APP_NAME } from "@/config/constants";
import { PartnerSolutionsList, type PartnerSolutionItem } from "@/components/partner/PartnerSolutionsList";

export const metadata: Metadata = {
  title: `My Solutions — Partner Portal — ${APP_NAME}`,
  robots: { index: false },
};

export default async function PartnerSolutionsPage() {
  const { partner } = await getEffectivePartnerContext();
  const partnerId = partner.id;
  const rawProjects = await getPartnerProjects(partnerId);

  const formattedProjects: PartnerSolutionItem[] = rawProjects.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    shortDescription: p.shortDescription,
    priceMode: p.priceMode,
    price: p.price ? p.price.toString() : null,
    originalPrice:
      (p as { originalPrice?: unknown }).originalPrice != null
        ? String((p as { originalPrice?: unknown }).originalPrice)
        : null,
    status: p.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    featured: Boolean(p.featured),
    category: p.category ? { id: p.category.id, name: p.category.name, slug: p.category.slug } : null,
    images: p.images?.map((img) => ({ url: img.url, altText: img.altText })) || [],
    _count: {
      inquiries: p._count?.inquiries || 0,
      transactions: p._count?.transactions || 0,
    },
  }));

  const published = formattedProjects.filter((p) => p.status === "PUBLISHED");
  const drafts = formattedProjects.filter((p) => p.status === "DRAFT");
  const featuredCount = formattedProjects.filter((p) => p.featured).length;

  return (
    <div className="space-y-8">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D9E2E4]">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#155761]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#102124]">
              My Software Solutions
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#526267]">
            Manage your listed software applications, draft architectures, pricing, and live catalog visibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/partner/solutions/import"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "gap-1.5 font-semibold text-xs border-[#BEDEE1] bg-white hover:bg-[#F3F7F7]",
            })}
          >
            <FileCode className="w-4 h-4 text-[#155761]" />
            Import JSON
          </Link>
          <Link
            href="/partner/solutions/new"
            className={buttonVariants({
              variant: "primary",
              size: "sm",
              className: "gap-2 shadow-xs font-bold text-xs",
            })}
          >
            <Plus className="w-4 h-4" />
            Add New Solution
          </Link>
        </div>
      </div>

      {/* ── Stats Summary ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
          <p className="text-xs text-[#526267] font-medium">Total Solutions</p>
          <p className="text-2xl font-bold text-[#102124] mt-1">{formattedProjects.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
          <p className="text-xs text-[#526267] font-medium">Live on Showcase</p>
          <p className="text-2xl font-bold text-[#2F7D78] mt-1">{published.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
          <p className="text-xs text-[#526267] font-medium">Featured Top Picks</p>
          <p className="text-2xl font-bold text-amber-600 mt-1 flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 fill-amber-500 text-amber-500" />
            {featuredCount}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
          <p className="text-xs text-[#526267] font-medium">Draft Architecture</p>
          <p className="text-2xl font-bold text-[#526267] mt-1">{drafts.length}</p>
        </div>
      </div>

      {/* ── Interactive Solutions List with Instant Featured Toggle ──── */}
      <PartnerSolutionsList initialProjects={formattedProjects} />
    </div>
  );
}
