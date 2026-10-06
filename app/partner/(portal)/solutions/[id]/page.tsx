// app/partner/(portal)/solutions/[id]/page.tsx
// Partner Solution detail view.

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import {
  ArrowLeft,
  Edit2,
  ExternalLink,
  Globe,
  CheckCircle2,
  Sparkles,
  Eye,
  Tag,
  AlertCircle,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceBlock } from "@/components/projects/PriceBlock";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Solution Details — Partner Portal — ${APP_NAME}`,
  robots: { index: false },
};

export default async function PartnerSolutionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { partner, user } = await getEffectivePartnerContext();

  const project = await db.project.findUnique({
    where: { id },
    include: {
      category: true,
      provider: true,
      images: { orderBy: { sortOrder: "asc" } },
      features: true,
      specifications: true,
      technologies: { include: { technology: true } },
      inquiries: true,
    },
  });

  if (!project) {
    notFound();
  }

  // Verify the solution belongs to the logged-in partner unless admin
  if (project.providerId !== partner.id && !user.isAdmin) {
    notFound();
  }

  const primaryImage = project.images[0]?.url || null;
  const isPublished = project.status === "PUBLISHED";

  const hasOffer =
    project.priceMode === "FIXED" &&
    (project as { originalPrice?: unknown }).originalPrice != null &&
    project.price != null &&
    Number((project as { originalPrice?: unknown }).originalPrice) > Number(project.price);
  const discountPct = hasOffer
    ? Math.round(
        ((Number((project as { originalPrice?: unknown }).originalPrice) - Number(project.price)) /
          Number((project as { originalPrice?: unknown }).originalPrice)) *
          100
      )
    : 0;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* ── Top Bar / Breadcrumb ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9E2E4]">
        <div className="flex items-center gap-3">
          <Link
            href="/partner/solutions"
            className="p-2 rounded-xl bg-white border border-[#D9E2E4] hover:bg-[#F3F7F7] text-[#526267] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#526267] uppercase tracking-wider">
                {project.category?.name || "Solution"}
              </span>
              <span className="text-[#D9E2E4]">•</span>
              <Badge
                variant={isPublished ? "success" : "secondary"}
                className="text-[10px]"
              >
                {project.status}
              </Badge>
            </div>
            <h1 className="text-2xl font-extrabold text-[#102124] tracking-tight">
              {project.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href={`/projects/${project.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D9E2E4] bg-white hover:bg-[#F3F7F7] text-xs font-semibold text-[#526267] transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Public Preview</span>
          </Link>
          <Link href={`/partner/solutions/${project.id}/edit`} className={buttonVariants({ variant: "primary", size: "sm", className: "gap-2 font-bold shadow-xs" })}>
              <Edit2 className="w-4 h-4" />
              <span>Edit Solution</span>
            </Link>
        </div>
      </div>

      {/* ── Admin Moderation Note Banner ─────────────────────────────── */}
      {(project as any).moderationNote && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm space-y-2 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Message from Admin Moderation Team</span>
            </div>
            <Link
              href={`/partner/solutions/${project.id}/edit`}
              className="text-xs font-bold text-[#155761] hover:underline"
            >
              Address &amp; Update Now →
            </Link>
          </div>
          <p className="text-xs sm:text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">
            {(project as any).moderationNote}
          </p>
        </div>
      )}

      {/* ── Key Metrics Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-[#526267] uppercase tracking-wider block mb-1.5">
            Pricing &amp; Offer
          </span>
          <PriceBlock
            priceMode={project.priceMode as any}
            price={project.price != null ? Number(project.price) : null}
            originalPrice={
              (project as any).originalPrice != null
                ? Number((project as any).originalPrice)
                : null
            }
            priceQualifier={((project as any).priceQualifier ?? "NONE") as any}
            dealType={((project as any).dealType ?? "NONE") as any}
            dealLabel={(project as any).dealLabel ?? null}
            dealStartsAt={(project as any).dealStartsAt ?? null}
            dealEndsAt={(project as any).dealEndsAt ?? null}
            variant="compact"
          />
        </div>

        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-[#526267] uppercase tracking-wider block">Enquiries Received</span>
          <p className="text-base font-extrabold text-[#102124] mt-1">
            {project.inquiries.length}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-[#526267] uppercase tracking-wider block">Solution Type</span>
          <p className="text-sm font-bold text-[#102124] mt-1 truncate">
            {project.projectType || "Not specified"}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-4 shadow-2xs">
          <span className="text-[11px] font-bold text-[#526267] uppercase tracking-wider block">Listed Date</span>
          <p className="text-sm font-semibold text-[#102124] mt-1">
            {formatDate(project.createdAt)}
          </p>
        </div>
      </div>

      {/* ── Main Solution Content ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Visual */}
          {primaryImage ? (
            <div className="bg-white rounded-3xl border border-[#D9E2E4] overflow-hidden shadow-xs">
              <div className="relative aspect-video w-full bg-[#102124]/5">
                <Image
                  src={primaryImage}
                  alt={project.title}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                  unoptimized={primaryImage.startsWith("data:")}
                  priority
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-[#D9E2E4] p-8 shadow-xs flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#F3F7F7] text-[#155761] flex items-center justify-center mb-2">
                <Sparkles className="w-6 h-6 text-[#155761]" />
              </div>
              <p className="text-sm font-bold text-[#102124]">{project.title}</p>
              <p className="text-xs text-[#526267] mt-1">No cover image uploaded for this solution</p>
            </div>
          )}

          {/* Description */}
          <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 space-y-4 shadow-xs">
            <h2 className="text-lg font-bold text-[#102124]">Solution Overview</h2>
            <p className="text-sm text-[#526267] leading-relaxed">
              {project.shortDescription}
            </p>
            {project.fullDescription && (
              <div className="pt-2 text-sm text-[#102124]/80 leading-relaxed whitespace-pre-line border-t border-[#F3F7F7]">
                {project.fullDescription}
              </div>
            )}
          </div>

          {/* Features */}
          {project.features && project.features.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 space-y-4 shadow-xs">
              <h2 className="text-lg font-bold text-[#102124]">Core Architecture &amp; Features</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4]">
                    <CheckCircle2 className="w-4 h-4 text-[#2F7D78] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-[#102124]">{f.feature}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Tech Stack */}
          <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-[#102124]">Technologies Used</h3>
            <div className="flex flex-wrap gap-1.5">
              {project.technologies && project.technologies.length > 0 ? (
                project.technologies.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-[#F3F7F7] border border-[#D9E2E4] text-xs font-medium text-[#155761]"
                  >
                    {t.technology.name}
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#526267]">Standard Web Stack</span>
              )}
            </div>
          </div>

          {/* External Links */}
          <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 space-y-3 shadow-xs">
            <h3 className="text-sm font-bold text-[#102124]">External Resources</h3>
            <div className="space-y-2">
              {project.demoUrl ? (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 rounded-xl border border-[#D9E2E4] hover:bg-[#F3F7F7] text-xs font-semibold text-[#155761] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#2F7D78]" />
                    <span>Live Interactive Demo</span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#526267]" />
                </a>
              ) : (
                <p className="text-xs text-[#526267]">No live demo URL configured.</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-[#155761] text-white rounded-3xl p-6 space-y-3 shadow-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2F7D78]" />
              <h3 className="text-sm font-bold">Solution Governance</h3>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Updates to your code, repository link, or deliverables sync instantly across the Soft Showcase catalog.
            </p>
            <div className="pt-2">
              <Link
                href={`/partner/solutions/${project.id}/edit`}
                className="w-full inline-block text-center py-2.5 px-4 rounded-xl bg-white hover:bg-[#F3F7F7] text-[#155761] font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Update Listing Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
