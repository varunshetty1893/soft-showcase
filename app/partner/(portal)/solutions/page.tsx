// app/partner/solutions/page.tsx
// Solution Partner - My Solutions list.

import type { Metadata } from "next";
import Link from "next/link";
import { getPartnerProjects } from "@/lib/db/queries/partner";
import {
  Plus,
  Layers,
  Edit2,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import { formatCurrency } from "@/lib/utils/format";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `My Solutions — Partner Portal — ${APP_NAME}`,
  robots: { index: false },
};

export default async function PartnerSolutionsPage() {
  const { partner } = await getEffectivePartnerContext();
  const partnerId = partner.id;
  const projects = await getPartnerProjects(partnerId);

  const published = projects.filter((p) => p.status === "PUBLISHED");
  const drafts = projects.filter((p) => p.status === "DRAFT");

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

        <Link href="/partner/solutions/new" className={buttonVariants({ variant: "primary", size: "sm", className: "gap-2 shadow-xs font-bold" })}>
            <Plus className="w-4 h-4" />
            Add New Solution
          </Link>
      </div>

      {/* ── Stats Summary ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
          <p className="text-xs text-[#526267] font-medium">Total Solutions</p>
          <p className="text-2xl font-bold text-[#102124] mt-1">{projects.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
          <p className="text-xs text-[#526267] font-medium">Live on Showcase</p>
          <p className="text-2xl font-bold text-[#2F7D78] mt-1">{published.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
          <p className="text-xs text-[#526267] font-medium">Draft Architecture</p>
          <p className="text-2xl font-bold text-[#526267] mt-1">{drafts.length}</p>
        </div>
      </div>

      {/* ── Solutions List / Table ─────────────────────────────────────── */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#D9E2E4] p-12 text-center shadow-xs space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F3F7F7] text-[#155761] flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#102124]">No Solutions Listed Yet</h3>
            <p className="text-xs text-[#526267] max-w-md mx-auto">
              You haven&apos;t added any software projects yet. Click below to add your first ready-to-deploy solution.
            </p>
          </div>
          <Link href="/partner/solutions/new" className={buttonVariants({ variant: "primary", size: "sm", className: "gap-2" })}>
              <Plus className="w-4 h-4" />
              Add Your First Solution
            </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const primaryImg = proj.images?.[0]?.url || null;

            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-[#D9E2E4] overflow-hidden shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow group"
              >
                <div>
                  {/* Thumbnail Banner — compact and properly sized */}
                  <div className="relative h-44 w-full bg-[#102124]/5 overflow-hidden">
                    {primaryImg ? (
                      <img
                        src={primaryImg}
                        alt={proj.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8FAFA] text-[#526267] p-4 text-center">
                        <Layers className="w-8 h-8 text-[#155761]/60 mb-2" />
                        <span className="text-xs font-semibold text-[#102124] line-clamp-1">{proj.title}</span>
                        <span className="text-[10px] text-[#526267] mt-0.5">No cover image</span>
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs ${
                          proj.status === "PUBLISHED"
                            ? "bg-[#DDF4EC] text-[#2F7D78] border border-[#2F7D78]/30"
                            : "bg-[#F3F7F7] text-[#526267] border border-[#D9E2E4]"
                        }`}
                      >
                        {proj.status === "PUBLISHED" ? "Live Catalog" : "Draft"}
                      </span>
                      {proj.category && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/95 backdrop-blur-xs text-[#102124] border border-[#D9E2E4] shadow-xs">
                          {proj.category.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-[#102124] line-clamp-1" title={proj.title}>
                        {proj.title}
                      </h3>
                      <span className="text-xs font-extrabold text-[#155761] shrink-0">
                        {proj.priceMode === "CONTACT"
                          ? "Contact"
                          : formatCurrency(Number(proj.price))}
                      </span>
                    </div>

                    <p className="text-xs text-[#526267] line-clamp-2 leading-relaxed">
                      {proj.shortDescription}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[#526267] pt-2 border-t border-[#F3F7F7]">
                      <span className="flex items-center gap-1 font-medium">
                        <MessageSquare className="w-3.5 h-3.5 text-[#155761]" />
                        {proj._count?.inquiries ?? 0} Enquiries
                      </span>
                      <span className="font-mono text-[10px] text-[#8A9B9F] truncate max-w-[120px]">
                        /{proj.slug}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-4 py-2.5 bg-[#F8FAFA] border-t border-[#D9E2E4] flex items-center justify-between gap-2">
                  <div>
                    {proj.status === "PUBLISHED" && (
                      <Link
                        href={`/projects/${proj.slug}`}
                        target="_blank"
                        className="text-xs font-semibold text-[#526267] hover:text-[#155761] flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View</span>
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Link href={`/partner/solutions/${proj.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm", className: "h-7 px-2.5 text-xs gap-1 font-semibold" })}>
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </Link>
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
