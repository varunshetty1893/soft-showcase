"use client";
// components/admin/ProjectTable.tsx
// Admin table for listing, filtering, and managing projects:
// - Phase 1: Shared auto-dismissing toast system (useToast).
// - Phase 3: Owner badge (Partner name / Admin-managed); Moderation link for partner-owned projects.
// - Phase 4: Effective price display, offer badge with remaining time or "Offer ended",
//   and quick actions (Extend, End offer now) for admin-managed projects.

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  ExternalLink,
  Edit3,
  Archive,
  Trash2,
  Sparkles,
  Loader2,
  ShieldCheck,
  UserCheck,
  Clock,
  Tag,
  CalendarPlus,
  XCircle,
  X,
  MoreHorizontal,
  CheckSquare,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { getProjectOwnership } from "@/lib/auth/project-permissions";
import {
  getEffectivePricing,
  toIstDatetimeLocal,
  fromIstDatetimeLocal,
  type DealTypeValue,
  type PriceQualifierValue,
} from "@/lib/utils/pricing";
import { formatCurrency } from "@/lib/utils/format";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  featuredOrder?: number;
  moderationNote?: string | null;
  moderatedAt?: string | null;
  priceMode: string;
  price: string | number | null;
  originalPrice?: string | number | null;
  priceQualifier?: PriceQualifierValue;
  dealType?: DealTypeValue;
  dealLabel?: string | null;
  dealStartsAt?: string | null;
  dealEndsAt?: string | null;
  createdAt: string;
  category: { id: string; name: string };
  provider: {
    id: string;
    displayName: string;
    userId?: string | null;
    user?: { id: string; role: string; isAdmin: boolean } | null;
  };
  images: { url: string }[];
};

type PaginatedProjects = {
  projects: ProjectRow[];
  total: number;
  totalPages: number;
  currentPage: number;
};

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProjectRow["status"] }) {
  const styles: Record<ProjectRow["status"], string> = {
    DRAFT: "bg-amber-50 text-amber-800 border-amber-200",
    PUBLISHED: "bg-[#DDF4EC] text-[#2F7D78] border-[#2F7D78]/25",
    ARCHIVED: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${styles[status]}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProjectTable() {
  const router = useRouter();
  const toast = useToast();

  const [data, setData] = useState<PaginatedProjects | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [ownerFilter, setOwnerFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  const visibleProjects = useMemo(() => {
    if (!data?.projects) return [];
    if (!ownerFilter) return data.projects;
    return data.projects.filter((p) => {
      const isPartner = getProjectOwnership(p) === "partner_owned";
      if (ownerFilter === "ADMIN") return !isPartner;
      if (ownerFilter === "PARTNER") return isPartner;
      return true;
    });
  }, [data?.projects, ownerFilter]);

  // Multi-selection & Bulk Actions
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Row Action Menu Dropdown state (matching UserManagementTable)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{
    top: number;
    right: number;
    openUpwards: boolean;
  } | null>(null);

  // Close action menu on window scroll
  useEffect(() => {
    if (!openMenuId) return;
    const handleScroll = () => {
      setOpenMenuId(null);
      setMenuAnchor(null);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [openMenuId]);

  const toggleSelectAll = () => {
    if (selectedIds.size === visibleProjects.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleProjects.map((p) => p.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  async function handleBulkFeature(featured: boolean) {
    if (selectedIds.size === 0) return;
    setIsBulkLoading(true);
    try {
      const res = await fetch("/api/admin/projects/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectIds: Array.from(selectedIds),
          patch: { featured },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to update projects");
      toast.success(
        `${selectedIds.size} project${selectedIds.size > 1 ? "s" : ""} ${
          featured ? "marked as featured" : "unfeatured"
        }.`
      );
      setSelectedIds(new Set());
      fetchProjects();
      router.refresh();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update selected projects"
      );
    } finally {
      setIsBulkLoading(false);
    }
  }

  async function handleBulkArchive() {
    if (selectedIds.size === 0) return;
    setIsBulkLoading(true);
    try {
      const res = await fetch("/api/admin/projects/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectIds: Array.from(selectedIds),
          patch: { status: "ARCHIVED" },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to archive projects");
      toast.success(
        `${selectedIds.size} project${selectedIds.size > 1 ? "s" : ""} archived.`
      );
      setSelectedIds(new Set());
      fetchProjects();
      router.refresh();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to archive selected projects"
      );
    } finally {
      setIsBulkLoading(false);
    }
  }

  async function confirmBulkDelete() {
    if (selectedIds.size === 0) return;
    setIsBulkLoading(true);
    try {
      const res = await fetch("/api/admin/projects/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectIds: Array.from(selectedIds),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to delete projects");
      toast.success(
        `${selectedIds.size} project${selectedIds.size > 1 ? "s" : ""} deleted permanently.`
      );
      setSelectedIds(new Set());
      setShowBulkDeleteModal(false);
      fetchProjects();
      router.refresh();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete selected projects"
      );
    } finally {
      setIsBulkLoading(false);
    }
  }

  // Archive confirmation
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [archivingTitle, setArchivingTitle] = useState<string>("");

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTitle, setDeletingTitle] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick toggle featured / status
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);

  // Phase 4: Quick offer modals (End offer now / Extend offer)
  const [endingOfferProject, setEndingOfferProject] = useState<ProjectRow | null>(null);
  const [extendingOfferProject, setExtendingOfferProject] = useState<ProjectRow | null>(null);
  const [extendEndsAtLocal, setExtendEndsAtLocal] = useState<string>("");
  const [offerActionLoading, setOfferActionLoading] = useState(false);

  async function handleQuickPublish(project: ProjectRow) {
    const nextStatus = project.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setTogglingStatusId(project.id);

    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === project.id ? { ...p, status: nextStatus } : p
        ),
      };
    });

    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to update project status");
      }
      toast.success(
        nextStatus === "PUBLISHED"
          ? `"${project.title}" is now published.`
          : `"${project.title}" moved to draft.`
      );
      router.refresh();
    } catch (err: unknown) {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          projects: prev.projects.map((p) =>
            p.id === project.id ? { ...p, status: project.status } : p
          ),
        };
      });
      toast.error(
        err instanceof Error ? err.message : "Failed to update project status"
      );
    } finally {
      setTogglingStatusId(null);
    }
  }

  async function handleToggleFeatured(project: ProjectRow) {
    const nextFeatured = !project.featured;
    setTogglingFeaturedId(project.id);

    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === project.id ? { ...p, featured: nextFeatured } : p
        ),
      };
    });

    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: nextFeatured }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to update featured status");
      }
      toast.success(
        nextFeatured
          ? `"${project.title}" marked as featured.`
          : `"${project.title}" removed from featured.`
      );
    } catch (err: unknown) {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          projects: prev.projects.map((p) =>
            p.id === project.id ? { ...p, featured: project.featured } : p
          ),
        };
      });
      toast.error(
        err instanceof Error ? err.message : "Failed to toggle featured status"
      );
    } finally {
      setTogglingFeaturedId(null);
    }
  }

  // ── Phase 4: End Offer Now & Extend Offer ──────────────────────────────────

  async function confirmEndOfferNow() {
    if (!endingOfferProject) return;
    setOfferActionLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${endingOfferProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerAction: "end_now" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to end offer");
      }
      toast.success(
        json.message || "Offer ended. Price reverted to the regular price."
      );
      setEndingOfferProject(null);
      fetchProjects();
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to end offer");
    } finally {
      setOfferActionLoading(false);
    }
  }

  async function confirmExtendOffer() {
    if (!extendingOfferProject) return;
    const utcIso = fromIstDatetimeLocal(extendEndsAtLocal);
    if (!utcIso || new Date(utcIso).getTime() <= Date.now()) {
      toast.error("Please select a future end date and time (IST).");
      return;
    }

    setOfferActionLoading(true);
    try {
      const res = await fetch(`/api/admin/projects/${extendingOfferProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerAction: "extend",
          dealEndsAt: utcIso,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to extend offer");
      }
      toast.success(json.message || "Offer end date extended.");
      setExtendingOfferProject(null);
      fetchProjects();
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to extend offer");
    } finally {
      setOfferActionLoading(false);
    }
  }

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/projects?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to fetch projects");
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to load projects. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, ownerFilter]);

  // ── Archive ────────────────────────────────────────────────────────────────

  async function confirmArchive() {
    if (!archivingId) return;
    try {
      const res = await fetch(`/api/admin/projects/${archivingId}?action=archive`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to archive");
      toast.success(`"${archivingTitle}" archived successfully.`);
      setArchivingId(null);
      fetchProjects();
      router.refresh();
    } catch {
      toast.error("Failed to archive project. Please try again.");
      setArchivingId(null);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function confirmDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/projects/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to delete project");
      }
      toast.success(`"${deletingTitle}" deleted permanently.`);
      setDeletingId(null);
      fetchProjects();
      router.refresh();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to delete project. Please try again."
      );
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or slug…"
            className="w-full bg-white border border-[#D9E2E4] text-[#102124] rounded-xl pl-9 pr-8 py-2 text-sm focus:outline-none focus:border-[#155761] focus:ring-1 focus:ring-[#155761] placeholder:text-[#526267]/60 shadow-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-black/5 text-[#526267]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-[#D9E2E4] text-[#102124] rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#155761] focus:ring-1 focus:ring-[#155761] shadow-xs cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="bg-white border border-[#D9E2E4] text-[#102124] rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:border-[#155761] focus:ring-1 focus:ring-[#155761] shadow-xs cursor-pointer"
          >
            <option value="">All Owners</option>
            <option value="ADMIN">Admin-Managed</option>
            <option value="PARTNER">Partner-Owned</option>
          </select>

          {/* Select Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsSelectMode((v) => !v);
              setSelectedIds(new Set());
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              isSelectMode
                ? "bg-[#155761] text-white border-[#155761] shadow-xs"
                : "bg-white text-[#526267] border-[#D9E2E4] hover:border-[#155761] hover:text-[#155761]"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            {isSelectMode ? "Cancel Select" : "Select"}
          </button>

          {(search || statusFilter || ownerFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setOwnerFilter("");
              }}
              className="text-xs text-[#526267] hover:text-[#155761] underline px-1 py-1 cursor-pointer font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar — appears when items are selected */}
      {isSelectMode && selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 bg-[#EFF9F5] border border-[#BEDEE1] rounded-xl px-4 py-2.5 text-xs">
          <span className="font-semibold text-[#155761] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {selectedIds.size} selected
          </span>
          <div className="h-4 w-px bg-[#BEDEE1]" />
          <button
            type="button"
            onClick={() => handleBulkFeature(true)}
            disabled={isBulkLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <Sparkles className="w-3 h-3" />
            Mark Featured
          </button>
          <button
            type="button"
            onClick={() => handleBulkFeature(false)}
            disabled={isBulkLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            Remove Featured
          </button>
          <button
            type="button"
            onClick={handleBulkArchive}
            disabled={isBulkLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <Archive className="w-3 h-3" />
            Archive All
          </button>
          <button
            type="button"
            onClick={() => setShowBulkDeleteModal(true)}
            disabled={isBulkLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <Trash2 className="w-3 h-3" />
            Delete All
          </button>
          {isBulkLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#155761]" />}
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-[#526267] hover:text-[#102124] text-[11px] underline cursor-pointer"
          >
            Clear selection
          </button>
        </div>
      )}

      {/* Table Card with Integrated Header, Body, and Pagination Footer */}
      <div className="rounded-2xl border border-[#D9E2E4] bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFA] text-[#526267] text-[11px] uppercase tracking-wider font-semibold border-b border-[#D9E2E4]">
              <tr>
                {isSelectMode && (
                  <th className="pl-4 pr-2 py-3.5 w-8">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === visibleProjects.length && visibleProjects.length > 0}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-[#D9E2E4] accent-[#155761] cursor-pointer"
                      title="Select all"
                    />
                  </th>
                )}
                <th className="px-5 py-3.5 w-[280px] max-w-[280px]">Project</th>
                <th className="px-4 py-3.5">Owner</th>
                <th className="px-4 py-3.5">Pricing &amp; Offer</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-center">Featured</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F7F7]">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4" colSpan={isSelectMode ? 7 : 6}>
                      <div className="h-4 bg-[#EEF3F4] rounded-md w-2/3" />
                    </td>
                  </tr>
                ))
              ) : visibleProjects.length === 0 ? (
                <tr>
                  <td colSpan={isSelectMode ? 7 : 6} className="px-5 py-14 text-center text-[#526267]">
                    <p className="font-semibold text-sm text-[#102124] mb-1">No projects found</p>
                    <p className="text-xs text-[#526267]">
                      {search || statusFilter || ownerFilter
                        ? "Try clearing or adjusting your search filters."
                        : "No software projects created yet."}
                    </p>
                  </td>
                </tr>
              ) : (
                visibleProjects.map((project) => {
                  const isPartnerOwned = getProjectOwnership(project) === "partner_owned";
                  const pricing = getEffectivePricing({
                    priceMode: project.priceMode,
                    price: project.price,
                    originalPrice: project.originalPrice,
                    priceQualifier: project.priceQualifier,
                    dealType: project.dealType,
                    dealLabel: project.dealLabel,
                    dealStartsAt: project.dealStartsAt,
                    dealEndsAt: project.dealEndsAt,
                  });

                  const hasConfiguredOffer =
                    project.priceMode === "FIXED" &&
                    ((project.dealType && project.dealType !== "NONE") ||
                      (project.originalPrice != null &&
                        Number(project.originalPrice) > Number(project.price ?? 0)));

                  return (
                    <tr
                      key={project.id}
                      className={`hover:bg-[#F8FAFA] transition-colors group ${
                        isSelectMode && selectedIds.has(project.id)
                          ? "bg-[#EFF9F5]"
                          : ""
                      }`}
                    >
                      {/* Checkbox (select mode) */}
                      {isSelectMode && (
                        <td className="pl-4 pr-2 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(project.id)}
                            onChange={() => toggleSelectOne(project.id)}
                            className="w-3.5 h-3.5 rounded border-[#D9E2E4] accent-[#155761] cursor-pointer"
                          />
                        </td>
                      )}
                      {/* Project */}
                      <td className="px-5 py-4 max-w-[280px]">
                        <div className="flex items-center gap-3.5 min-w-0">
                          {project.images[0] ? (
                            <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 border border-[#D9E2E4] shadow-2xs">
                              <Image
                                src={project.images[0].url}
                                alt={project.title}
                                fill
                                sizes="44px"
                                className="object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] flex items-center justify-center shrink-0 font-bold text-xs">
                              App
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/admin/projects/${project.id}/edit`}
                              className="text-[#102124] font-bold hover:text-[#155761] transition-colors text-sm truncate block"
                              title={project.title}
                            >
                              {project.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-1 min-w-0">
                              <span className="px-2 py-0.5 bg-[#F3F7F7] rounded text-[10px] border border-[#D9E2E4] text-[#526267] font-medium whitespace-nowrap shrink-0">
                                {project.category.name}
                              </span>
                              <span
                                className="text-[#8A9A9E] text-[11px] font-mono truncate block flex-1"
                                title={`/projects/${project.slug}`}
                              >
                                /projects/{project.slug}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner Badge */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        {isPartnerOwned ? (
                          <div className="space-y-0.5">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200 whitespace-nowrap"
                              data-testid="owner-badge-partner"
                            >
                              <UserCheck className="w-3 h-3 text-amber-700 shrink-0" />
                              <span>Partner: {project.provider.displayName}</span>
                            </span>
                            {project.moderationNote && (
                              <p className="text-[10px] text-amber-800 line-clamp-1">
                                Note: {project.moderationNote}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F3F7F7] text-[#155761] border border-[#BEDEE1] whitespace-nowrap"
                              data-testid="owner-badge-admin"
                            >
                              <ShieldCheck className="w-3 h-3 text-[#155761] shrink-0" />
                              <span>Admin-managed</span>
                            </span>
                            <p className="text-[10px] text-[#526267] font-medium pl-1">
                              {project.provider.displayName}
                            </p>
                          </div>
                        )}
                      </td>

                      {/* Pricing & Offer */}
                      <td className="px-4 py-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-[#102124] text-sm">
                              {pricing.formattedEffectivePrice}
                            </span>
                            {pricing.isDiscounted && pricing.regularPrice != null && (
                              <span className="text-[11px] text-[#8A9A9E] line-through">
                                {formatCurrency(pricing.regularPrice)}
                              </span>
                            )}
                          </div>

                          {hasConfiguredOffer && (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {pricing.offerStatus === "ENDED" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-300 whitespace-nowrap">
                                  <Clock className="w-2.5 h-2.5 shrink-0" />
                                  <span>Offer ended</span>
                                </span>
                              ) : pricing.offerStatus === "SCHEDULED" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200 whitespace-nowrap">
                                  <Clock className="w-2.5 h-2.5 shrink-0" />
                                  <span>Scheduled offer</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                                  <Tag className="w-2.5 h-2.5 shrink-0" />
                                  <span>
                                    {pricing.badgeLabel || `${pricing.discountPercentage}% OFF`}
                                    {pricing.countdownLabel ? ` · ${pricing.countdownLabel}` : ""}
                                  </span>
                                </span>
                              )}

                              {/* Quick offer actions for Admin-Managed projects */}
                              {!isPartnerOwned && (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setExtendingOfferProject(project);
                                      setExtendEndsAtLocal(
                                        project.dealEndsAt
                                          ? toIstDatetimeLocal(project.dealEndsAt)
                                          : ""
                                      );
                                    }}
                                    className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-semibold bg-white hover:bg-[#F3F7F7] text-[#155761] border border-[#D9E2E4] transition cursor-pointer whitespace-nowrap shadow-2xs"
                                    title="Extend offer end date"
                                  >
                                    <CalendarPlus className="w-2.5 h-2.5 shrink-0" />
                                    <span>Extend</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEndingOfferProject(project)}
                                    className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer whitespace-nowrap shadow-2xs"
                                    title="End offer now and revert to regular price"
                                  >
                                    <XCircle className="w-2.5 h-2.5 shrink-0" />
                                    <span>End offer now</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <StatusBadge status={project.status} />
                      </td>

                      {/* Featured Toggle Button */}
                      <td className="px-4 py-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(project)}
                          disabled={togglingFeaturedId === project.id}
                          title={
                            project.featured
                              ? "Featured on homepage & catalog. Click to unfeature."
                              : "Not featured. Click to mark as featured."
                          }
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                            project.featured
                              ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs"
                              : "bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-emerald-700 border border-dashed border-gray-300 hover:border-emerald-300"
                          }`}
                        >
                          {togglingFeaturedId === project.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                          ) : project.featured ? (
                            <>
                              <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                              <span>Featured</span>
                            </>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px]">
                              <span>+</span>
                              <span>Feature</span>
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Actions — ⋯ dropdown */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Publish / View button */}
                          {project.status !== "PUBLISHED" ? (
                            <button
                              type="button"
                              onClick={() => handleQuickPublish(project)}
                              disabled={togglingStatusId === project.id}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#2F7D78] hover:bg-[#24635F] border border-[#2F7D78] px-2.5 py-1 rounded-lg transition cursor-pointer shadow-2xs whitespace-nowrap"
                            >
                              {togglingStatusId === project.id ? "Publishing…" : "Publish"}
                            </button>
                          ) : (
                            <Link
                              href={`/projects/${project.slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#526267] hover:text-[#155761] border border-[#D9E2E4] hover:bg-[#F3F7F7] px-2.5 py-1 rounded-lg transition whitespace-nowrap"
                            >
                              <ExternalLink className="w-3 h-3" />
                              View
                            </Link>
                          )}

                          {/* ⋯ Menu Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              if (openMenuId === project.id) {
                                setOpenMenuId(null);
                                setMenuAnchor(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const openUpwards = window.innerHeight - rect.bottom < 200;
                                setMenuAnchor({
                                  top: openUpwards ? rect.top - 6 : rect.bottom + 6,
                                  right: window.innerWidth - rect.right,
                                  openUpwards,
                                });
                                setOpenMenuId(project.id);
                              }
                            }}
                            className="w-8 h-8 rounded-lg border border-[#D9E2E4] bg-white hover:bg-[#F3F7F7] flex items-center justify-center text-[#526267] cursor-pointer transition shadow-xs"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* ⋯ Dropdown */}
                          {openMenuId === project.id && menuAnchor && (
                            <>
                              {/* Backdrop */}
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setMenuAnchor(null);
                                }}
                              />
                              <div
                                style={{
                                  position: "fixed",
                                  top: menuAnchor.openUpwards ? undefined : `${menuAnchor.top}px`,
                                  bottom: menuAnchor.openUpwards
                                    ? `${window.innerHeight - menuAnchor.top}px`
                                    : undefined,
                                  right: `${menuAnchor.right}px`,
                                }}
                                className="z-50 w-48 bg-white border border-[#D9E2E4] rounded-xl shadow-2xl overflow-hidden animate-in fade-in duration-150"
                              >
                                {/* Edit / Moderate */}
                                <Link
                                  href={`/admin/projects/${project.id}/edit`}
                                  onClick={() => { setOpenMenuId(null); setMenuAnchor(null); }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[#102124] hover:bg-[#F3F7F7] cursor-pointer transition"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-[#155761]" />
                                  {isPartnerOwned ? "Moderate" : "Edit"}
                                </Link>

                                {/* Archive */}
                                {project.status !== "ARCHIVED" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setMenuAnchor(null);
                                      setArchivingId(project.id);
                                      setArchivingTitle(project.title);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-amber-800 hover:bg-amber-50 cursor-pointer transition"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                    Archive
                                  </button>
                                )}

                                <div className="border-t border-[#D9E2E4]" />

                                {/* Delete */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setMenuAnchor(null);
                                    setDeletingId(project.id);
                                    setDeletingTitle(project.title);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-rose-700 hover:bg-rose-50 cursor-pointer transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Delete Permanently
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Integrated Pagination Footer */}
        {data && data.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 bg-[#F8FAFA] border-t border-[#D9E2E4] text-xs text-[#526267]">
            <span>
              Showing <strong className="text-[#102124]">{(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)}</strong> of{" "}
              <strong className="text-[#102124]">{data.total}</strong> projects
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-[#526267] mr-1">
                Page {page} of {Math.max(1, data.totalPages)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-xs h-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                ← Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                className="text-xs h-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Phase 4: End Offer Now confirmation modal */}
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

      {/* Phase 4: Extend Offer modal */}
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

      {/* Archive confirmation modal */}
      {archivingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#D9E2E4] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-base font-bold text-[#102124] mb-2">Archive Project</h3>
            <p className="text-xs text-[#526267] mb-6 leading-relaxed">
              Are you sure you want to archive{" "}
              <strong className="text-[#102124] font-semibold">{archivingTitle}</strong>?
              The project will no longer be visible on the public showcase catalog.
            </p>
            <div className="flex gap-2.5 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArchivingId(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmArchive}
                className="text-xs"
              >
                Archive Project
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#D9E2E4] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-base font-bold text-rose-700 mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              Delete Project
            </h3>
            <p className="text-xs text-[#526267] mb-6 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-[#102124] font-semibold">{deletingTitle}</strong>?
              This action cannot be undone.
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
                onClick={confirmDelete}
                disabled={isDeleting}
                className="text-xs"
              >
                {isDeleting ? "Deleting…" : "Permanently Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete confirmation modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#D9E2E4] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-base font-bold text-rose-700 mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              Delete {selectedIds.size} Project{selectedIds.size > 1 ? "s" : ""}?
            </h3>
            <p className="text-xs text-[#526267] mb-6 leading-relaxed">
              You are about to permanently delete{" "}
              <strong className="text-[#102124]">
                {selectedIds.size} project{selectedIds.size > 1 ? "s" : ""}
              </strong>
              . This action cannot be undone. All inquiries linked to these projects will also be removed.
            </p>
            <div className="flex gap-2.5 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isBulkLoading}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmBulkDelete}
                disabled={isBulkLoading}
                className="text-xs"
              >
                {isBulkLoading ? "Deleting…" : `Delete ${selectedIds.size} Project${selectedIds.size > 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
