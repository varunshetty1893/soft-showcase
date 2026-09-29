// app/partner/solutions/page.tsx
// Solution Partner - My Solutions list.

import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { getPartnerProjects } from "@/lib/db/queries/partner";
import {
  Plus,
  Layers,
  Edit2,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Clock,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import { formatCurrency } from "@/lib/utils/format";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `My Solutions — Partner Portal — ${APP_NAME}`,
  robots: { index: false },
};

export default async function PartnerSolutionsPage() {
  const { user, partner } = await getEffectivePartnerContext();
  const partnerId = partner.id;
  let projects = await getPartnerProjects(partnerId);
  if (projects.length === 0) {
    projects = await getPartnerProjects("prov-varun");
  }

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

        <Link href="/partner/solutions/new">
          <Button variant="primary" size="sm" className="gap-2 shadow-xs font-bold">
            <Plus className="w-4 h-4" />
            Add New Solution
          </Button>
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
          <Link href="/partner/solutions/new">
            <Button variant="primary" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Solution
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((proj) => {
            const primaryImg = proj.images?.[0]?.url || "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop";

            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-[#D9E2E4] overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  {/* Thumbnail Banner */}
                  <div className="relative aspect-video w-full bg-[#102124]/5 overflow-hidden">
                    <img
                      src={primaryImg}
                      alt={proj.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold shadow-xs ${
                          proj.status === "PUBLISHED"
                            ? "bg-[#DDF4EC] text-[#2F7D78] border border-[#2F7D78]/30"
                            : "bg-[#F3F7F7] text-[#526267] border border-[#D9E2E4]"
                        }`}
                      >
                        {proj.status === "PUBLISHED" ? "Live Catalog" : "Draft"}
                      </span>
                      {proj.category && (
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-white/90 backdrop-blur-xs text-[#102124] border border-[#D9E2E4] shadow-xs">
                          {proj.category.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-base text-[#102124] line-clamp-1">
                        {proj.title}
                      </h3>
                      <span className="text-sm font-extrabold text-[#155761] shrink-0">
                        {proj.priceMode === "CONTACT"
                          ? "Contact"
                          : formatCurrency(Number(proj.price))}
                      </span>
                    </div>

                    <p className="text-xs text-[#526267] line-clamp-2 leading-relaxed">
                      {proj.shortDescription}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-[#526267] pt-2 border-t border-[#F3F7F7]">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-[#155761]" />
                        {proj._count?.inquiries ?? 0} Enquiries
                      </span>
                      <span className="font-mono text-[10px]">
                        /{proj.slug}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3.5 bg-[#F8FAFA] border-t border-[#D9E2E4] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {proj.status === "PUBLISHED" && (
                      <Link
                        href={`/projects/${proj.slug}`}
                        target="_blank"
                        className="text-xs font-semibold text-[#526267] hover:text-[#155761] flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Public Page</span>
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/partner/solutions/${proj.id}/edit`}>
                      <Button variant="outline" size="sm" className="h-8 px-3 text-xs gap-1.5">
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Solution</span>
                      </Button>
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
