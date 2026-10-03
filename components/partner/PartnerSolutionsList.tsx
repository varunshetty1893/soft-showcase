"use client";
// components/partner/PartnerSolutionsList.tsx
// Partner Solutions list with:
// - Phase 1: Shared auto-dismissing toast system (useToast).
// - Phase 3: Displays admin moderationNote badge and enforces moderation hold on status toggle.
// - Phase 4: Uses getEffectivePricing, displays remaining offer time or "Offer ended",
//   and provides quick actions (Extend, End offer now).

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Layers,
  Edit2,
  ExternalLink,
  MessageSquare,
  Star,
  Loader2,
  FileCode,
  Plus,
  Trash2,
  ShieldAlert,
  Clock,
  Tag,
  CalendarPlus,
  XCircle,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";
import { useToast } from "@/components/ui/toast";
import { hasAdminModerationHold } from "@/lib/auth/project-permissions";
import {
  getEffectivePricing,
  toIstDatetimeLocal,
  fromIstDatetimeLocal,
  type DealTypeValue,
  type PriceQualifierValue,
} from "@/lib/utils/pricing";

export interface PartnerSolutionItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  priceMode: string;
  price: string | number | null;
  originalPrice?: string | number | null;
  priceQualifier?: PriceQualifierValue;
  dealType?: DealTypeValue;
  dealLabel?: string | null;
  dealStartsAt?: string | null;
  dealEndsAt?: string | null;
  moderationNote?: string | null;
  moderatedAt?: string | null;
  moderatedById?: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  category?: { id: string; name: string; slug: string } | null;
  images?: Array<{ url: string; altText?: string | null }>;
  _count?: {
    inquiries: number;
    transactions?: number;
  };
}

interface PartnerSolutionsListProps {
  initialProjects: PartnerSolutionItem[];
}

export function PartnerSolutionsList({ initialProjects }: PartnerSolutionsListProps) {
  const router = useRouter();
  const toast = useToast();
  const [projects, setProjects] = React.useState<PartnerSolutionItem[]>(initialProjects);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  // Search & Pagination state
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL");
  const [page, setPage] = React.useState(1);
  const pageSize = 9;

  // Delete solution state
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [deletingTitle, setDeletingTitle] = React.useState<string>("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Phase 4: Quick offer modals (End offer now / Extend offer)
  const [endingOfferProject, setEndingOfferProject] =
    React.useState<PartnerSolutionItem | null>(null);
  const [extendingOfferProject, setExtendingOfferProject] =
    React.useState<PartnerSolutionItem | null>(null);
  const [extendEndsAtLocal, setExtendEndsAtLocal] = React.useState<string>("");
  const [offerActionLoading, setOfferActionLoading] = React.useState(false);

  React.useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const filteredProjects = React.useMemo(() => {
    return projects.filter((p) => {
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesSlug = p.slug.toLowerCase().includes(q);
        const matchesCategory = p.category?.name?.toLowerCase().includes(q) ?? false;
        const matchesDesc = (p.shortDescription || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesSlug && !matchesCategory && !matchesDesc) return false;
      }
      return true;
    });
  }, [projects, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleDeleteSolution = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/partner/solutions/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete solution");
      }
      setProjects((prev) => prev.filter((p) => p.id !== deletingId));
      toast.success(`"${deletingTitle}" deleted successfully.`);
      setDeletingId(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete solution. Please try again.");
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleFeatured = async (project: PartnerSolutionItem) => {
    const nextFeatured = !project.featured;
    setTogglingId(project.id);

    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, featured: nextFeatured } : p))
    );

    try {
      const res = await fetch(`/api/partner/solutions/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: nextFeatured }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to update featured status");
      }

      toast.success(
        nextFeatured
          ? `"${project.title}" marked as featured.`
          : `"${project.title}" removed from featured.`
      );
      router.refresh();
    } catch (err: any) {
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, featured: project.featured } : p))
      );
      toast.error(err?.message || "Failed to change featured status. Please try again.");
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleStatus = async (project: PartnerSolutionItem) => {
    const isHeld = hasAdminModerationHold(project);
    if (isHeld && project.status !== "PUBLISHED") {
      toast.warning(
        `This solution has an administrator moderation hold${
          project.moderationNote ? `: "${project.moderationNote}"` : "."
        } You can edit its content, and an administrator will re-publish it after review.`
      );
      return;
    }

    const nextStatus = project.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setTogglingId(project.id);

    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, status: nextStatus } : p))
    );

    try {
      const res = await fetch(`/api/partner/solutions/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to update publishing status");
      }

      toast.success(
        nextStatus === "PUBLISHED"
          ? `"${project.title}" is now live on the showcase.`
          : `"${project.title}" moved to draft.`
      );
      router.refresh();
    } catch (err: any) {
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, status: project.status } : p))
      );
      toast.error(
        err?.message || "Failed to update publishing status. Please try again."
      );
    } finally {
      setTogglingId(null);
    }
  };

  // ── Phase 4: End Offer Now & Extend Offer ──────────────────────────────────

  const confirmEndOfferNow = async () => {
    if (!endingOfferProject) return;
    setOfferActionLoading(true);
    try {
      const res = await fetch(`/api/partner/solutions/${endingOfferProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerAction: "end_now" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to end offer");
      }
      const revertedPrice =
        endingOfferProject.originalPrice ?? endingOfferProject.price;
      setProjects((prev) =>
        prev.map((p) =>
          p.id === endingOfferProject.id
            ? {
                ...p,
                price: revertedPrice ?? p.price,
                originalPrice: null,
                dealType: "NONE",
                dealLabel: null,
                dealStartsAt: null,
                dealEndsAt: null,
              }
            : p
        )
      );
      toast.success(
        json.message || "Offer ended. Price reverted to the regular price."
      );
      setEndingOfferProject(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to end offer");
    } finally {
      setOfferActionLoading(false);
    }
  };

  const confirmExtendOffer = async () => {
    if (!extendingOfferProject) return;
    const utcIso = fromIstDatetimeLocal(extendEndsAtLocal);
    if (!utcIso || new Date(utcIso).getTime() <= Date.now()) {
      toast.error("Please select a future end date and time (IST).");
      return;
    }

    setOfferActionLoading(true);
    try {
      const res = await fetch(
        `/api/partner/solutions/${extendingOfferProject.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            offerAction: "extend",
            dealEndsAt: utcIso,
          }),
        }
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to extend offer");
      }
      setProjects((prev) =>
        prev.map((p) =>
          p.id === extendingOfferProject.id
            ? { ...p, dealEndsAt: utcIso }
            : p
        )
      );
      toast.success(json.message || "Offer end date extended.");
      setExtendingOfferProject(null);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to extend offer");
    } finally {
      setOfferActionLoading(false);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-12 text-center shadow-xs space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#F3F7F7] text-[#155761] flex items-center justify-center mx-auto">
          <Layers className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-[#102124]">No Solutions Listed Yet</h3>
          <p className="text-xs text-[#526267] max-w-md mx-auto leading-relaxed">
            You haven&apos;t added any software projects yet. You can create a solution manually or import from an AI-generated JSON file in one click.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/partner/solutions/new"
            className={buttonVariants({
              variant: "primary",
              size: "sm",
              className: "gap-2 font-bold shadow-xs",
            })}
          >
            <Plus className="w-4 h-4" />
            Add Solution
          </Link>
          <Link
            href="/partner/solutions/import"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "gap-2 font-semibold",
            })}
          >
            <FileCode className="w-4 h-4 text-[#155761]" />
            Import via JSON
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search Bar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-[#D9E2E4] shadow-xs">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-[#526267] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by solution, category..."
            className="w-full h-9 pl-9 pr-8 bg-[#F8FAFA] border border-[#D9E2E4] text-[#102124] rounded-xl text-xs focus:outline-none focus:border-[#155761] placeholder:text-[#526267]"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#526267] hover:text-[#102124]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {[
            { label: "All", value: "ALL" },
            { label: "Published", value: "PUBLISHED" },
            { label: "Drafts", value: "DRAFT" },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                statusFilter === tab.value
                  ? "bg-[#155761] text-white shadow-2xs"
                  : "bg-white text-[#526267] border border-[#D9E2E4] hover:bg-[#F3F7F7]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-10 text-center shadow-xs space-y-2">
          <Layers className="w-8 h-8 text-[#526267] mx-auto opacity-50" />
          <h4 className="text-sm font-bold text-[#102124]">No Solutions Found</h4>
          <p className="text-xs text-[#526267] max-w-sm mx-auto">
            {search
              ? `No solutions matched "${search}". Try searching with a different term.`
              : `No solutions found under "${statusFilter}".`}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {paginatedProjects.map((proj) => {
              const primaryImg = proj.images?.[0]?.url || null;
          const isToggling = togglingId === proj.id;
          const moderationHold = hasAdminModerationHold(proj);

          const pricing = getEffectivePricing({
            priceMode: proj.priceMode,
            price: proj.price,
            originalPrice: proj.originalPrice,
            priceQualifier: proj.priceQualifier,
            dealType: proj.dealType,
            dealLabel: proj.dealLabel,
            dealStartsAt: proj.dealStartsAt,
            dealEndsAt: proj.dealEndsAt,
          });

          const hasConfiguredOffer =
            proj.priceMode === "FIXED" &&
            ((proj.dealType && proj.dealType !== "NONE") ||
              (proj.originalPrice != null &&
                Number(proj.originalPrice) > Number(proj.price ?? 0)));

          return (
            <div
              key={proj.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between group shadow-2xs hover:shadow-md ${
                proj.featured
                  ? "border-amber-300 ring-1 ring-amber-300/40"
                  : "border-[#D9E2E4]"
              }`}
            >
              <div>
                {/* Thumbnail Banner */}
                <div className="relative h-44 w-full bg-[#102124]/5 overflow-hidden">
                  {primaryImg ? (
                    <Image
                      src={primaryImg}
                      alt={proj.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-102 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8FAFA] text-[#526267] p-4 text-center">
                      <Layers className="w-8 h-8 text-[#155761]/60 mb-2" />
                      <span className="text-xs font-semibold text-[#102124] line-clamp-1">
                        {proj.title}
                      </span>
                      <span className="text-[10px] text-[#526267] mt-0.5">
                        No cover image
                      </span>
                    </div>
                  )}

                  {/* Top-Left Status and Category Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap z-10">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs ${
                        proj.status === "PUBLISHED"
                          ? "bg-[#DDF4EC] text-[#2F7D78] border border-[#2F7D78]/30"
                          : moderationHold
                          ? "bg-amber-100 text-amber-950 border border-amber-300"
                          : "bg-[#F3F7F7] text-[#526267] border border-[#D9E2E4]"
                      }`}
                    >
                      {proj.status === "PUBLISHED"
                        ? "Live"
                        : moderationHold
                        ? "Moderation Hold"
                        : "Draft"}
                    </span>
                    {proj.category && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/95 backdrop-blur-xs text-[#102124] border border-[#D9E2E4] shadow-xs">
                        {proj.category.name}
                      </span>
                    )}
                  </div>

                  {/* Top-Right Quick Featured Toggle Button */}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(proj)}
                      disabled={isToggling}
                      title={
                        proj.featured
                          ? "Featured solution (highlighted in catalog). Click to unfeature."
                          : "Click to mark as Featured on catalog & homepage"
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-sm transition-all cursor-pointer select-none active:scale-95 ${
                        proj.featured
                          ? "bg-amber-400 hover:bg-amber-500 text-amber-950 border border-amber-500"
                          : "bg-black/60 hover:bg-[#155761] text-white backdrop-blur-xs border border-white/20"
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : proj.featured ? (
                        <>
                          <Star className="w-3.5 h-3.5 fill-current text-amber-950" />
                          <span>Featured</span>
                        </>
                      ) : (
                        <>
                          <Star className="w-3.5 h-3.5 text-white/80" />
                          <span>+ Feature</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-2.5">
                  {/* Phase 3: Admin Moderation Note / Request Changes Badge */}
                  {proj.moderationNote && (
                    <div
                      className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-[11px] flex items-start gap-2"
                      data-testid="partner-moderation-note-badge"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">
                          {moderationHold
                            ? "Moderation Hold — Action Needed:"
                            : "Admin Note / Changes Requested:"}
                        </span>
                        <span className="text-amber-900 leading-relaxed">
                          {proj.moderationNote}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="font-bold text-sm text-[#102124] line-clamp-1"
                      title={proj.title}
                    >
                      {proj.title}
                    </h3>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5 justify-end">
                        {pricing.isDiscounted && pricing.regularPrice != null && (
                          <span className="text-[11px] text-[#8A9A9E] line-through font-medium">
                            {formatCurrency(pricing.regularPrice)}
                          </span>
                        )}
                        <span className="text-xs font-extrabold text-[#155761]">
                          {pricing.formattedEffectivePrice}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Phase 4: Offer Status & Quick Actions (Extend / End offer now) */}
                  {hasConfiguredOffer && (
                    <div className="p-2 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {pricing.offerStatus === "ENDED" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-300">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Offer ended</span>
                          </span>
                        ) : pricing.offerStatus === "SCHEDULED" ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                            <Clock className="w-2.5 h-2.5" />
                            <span>Scheduled offer</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Tag className="w-2.5 h-2.5" />
                            <span>
                              {pricing.badgeLabel || `${pricing.discountPercentage}% OFF`}
                              {pricing.countdownLabel
                                ? ` · ${pricing.countdownLabel}`
                                : ""}
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setExtendingOfferProject(proj);
                            setExtendEndsAtLocal(
                              proj.dealEndsAt
                                ? toIstDatetimeLocal(proj.dealEndsAt)
                                : ""
                            );
                          }}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white hover:bg-[#F3F7F7] text-[#155761] border border-[#D9E2E4] cursor-pointer"
                          title="Extend offer end date"
                        >
                          <CalendarPlus className="w-2.5 h-2.5" />
                          <span>Extend</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEndingOfferProject(proj)}
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                          title="End offer now and revert to regular price"
                        >
                          <XCircle className="w-2.5 h-2.5" />
                          <span>End offer now</span>
                        </button>
                      </div>
                    </div>
                  )}

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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(proj)}
                    disabled={isToggling || (moderationHold && proj.status !== "PUBLISHED")}
                    title={
                      moderationHold && proj.status !== "PUBLISHED"
                        ? "Under admin moderation hold. Edit content and wait for admin review."
                        : undefined
                    }
                    className={`h-7 px-2.5 text-xs font-bold rounded-lg border transition-colors ${
                      moderationHold && proj.status !== "PUBLISHED"
                        ? "bg-amber-50 text-amber-800 border-amber-200 opacity-75 cursor-not-allowed"
                        : proj.status === "PUBLISHED"
                        ? "bg-white hover:bg-gray-100 text-[#526267] border-[#D9E2E4] cursor-pointer"
                        : "bg-[#2F7D78] hover:bg-[#24635F] text-white border-[#2F7D78] shadow-2xs cursor-pointer"
                    }`}
                  >
                    {proj.status === "PUBLISHED"
                      ? "Move to Draft"
                      : moderationHold
                      ? "Held by Admin"
                      : "Publish Now"}
                  </button>
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
                  <Link
                    href={`/partner/solutions/${proj.id}/edit`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "h-7 px-2.5 text-xs gap-1 font-semibold",
                    })}
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setDeletingId(proj.id);
                      setDeletingTitle(proj.title);
                    }}
                    className="h-7 px-2.5 text-xs gap-1 font-semibold inline-flex items-center text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 hover:bg-rose-600 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      {filteredProjects.length > 0 && (
        <div className="p-4 rounded-2xl border border-[#D9E2E4] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#526267] shadow-xs">
          <div>
            Showing <span className="font-semibold text-[#102124]">{(currentPage - 1) * pageSize + 1}</span>–
            <span className="font-semibold text-[#102124]">{Math.min(currentPage * pageSize, filteredProjects.length)}</span> of{" "}
            <span className="font-semibold text-[#102124]">{filteredProjects.length}</span> solutions
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium text-[#526267] mr-1">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs h-8 gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs h-8 gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </>
    )}

      {/* Phase 4: End Offer Now Confirmation Modal */}
      {endingOfferProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#D9E2E4] rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#102124]">
              End Promotional Offer Now?
            </h3>
            <p className="text-xs text-[#526267] leading-relaxed">
              Ending the offer on{" "}
              <strong className="text-[#102124]">{endingOfferProject.title}</strong>{" "}
              will change the selling price from{" "}
              <strong className="text-[#102124]">
                {formatCurrency(Number(endingOfferProject.price ?? 0))}
              </strong>{" "}
              to the regular price{" "}
              <strong className="text-[#155761]">
                {formatCurrency(
                  Number(
                    endingOfferProject.originalPrice ??
                      endingOfferProject.price ??
                      0
                  )
                )}
              </strong>{" "}
              and clear all promotional offer fields.
            </p>
            <div className="flex gap-2.5 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEndingOfferProject(null)}
                disabled={offerActionLoading}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmEndOfferNow}
                disabled={offerActionLoading}
                className="text-xs"
              >
                {offerActionLoading ? "Ending…" : "End Offer & Revert Price"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 4: Extend Offer Modal */}
      {extendingOfferProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#D9E2E4] rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#102124]">
              Extend Promotional Offer
            </h3>
            <p className="text-xs text-[#526267]">
              Choose a new future end date and time (IST) for{" "}
              <strong className="text-[#102124]">
                {extendingOfferProject.title}
              </strong>
              .
            </p>
            <div>
              <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                New Offer End Date &amp; Time (IST) *
              </label>
              <input
                type="datetime-local"
                value={extendEndsAtLocal}
                onChange={(e) => setExtendEndsAtLocal(e.target.value)}
                className="w-full h-10 bg-white border border-[#D9E2E4] text-[#102124] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#155761]"
              />
            </div>
            <div className="flex gap-2.5 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExtendingOfferProject(null)}
                disabled={offerActionLoading}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={confirmExtendOffer}
                disabled={offerActionLoading}
                className="text-xs"
              >
                {offerActionLoading ? "Saving…" : "Extend Offer"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#D9E2E4] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-base font-bold text-rose-700 mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              Delete Solution
            </h3>
            <p className="text-xs text-[#526267] mb-6 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-[#102124] font-semibold">{deletingTitle}</strong>?
              This will remove the solution from your dashboard and the public catalog.
            </p>
            <div className="flex gap-2.5 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteSolution}
                disabled={isDeleting}
                className="text-xs"
              >
                {isDeleting ? "Deleting…" : "Permanently Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
