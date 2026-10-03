"use client";
// components/admin/ProviderTable.tsx
// Client component displaying all providers in an admin table with:
// - Phase 1: Shared auto-dismissing toast feedback (no sticky inline banners)
// - Phase 2A: Single state-aware status toggle button (Deactivate / Activate / Approve-Reject / Re-approve / Restore),
//   Deactivate confirmation modal with published project impact & optional reason (max 300 chars),
//   self-lockout protection tooltip when linked to signed-in admin's own user
// - Phase 2B: "⋯" menu with "Remove provider…" dialog (impact counts, required reason, type provider name,
//   "Notify the partner by email" checkbox), Removed tab (with count, excluded from All Providers),
//   Restore action, and Permanent Delete action (only on Removed tab when 0 inquiries/transactions/tickets).

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  ExternalLink,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  Ban,
  MoreHorizontal,
  RotateCcw,
  Trash2,
  Power,
  Loader2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { getProviderStatusButtonSpec } from "@/lib/providers/provider-state";

export type ProviderTableRow = {
  id: string;
  userId?: string | null;
  displayName: string;
  email: string;
  whatsappNumber: string | null;
  bio?: string | null;
  location?: string | null;
  skills?: unknown;
  technologies?: unknown;
  portfolioUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  solutionsOffered?: string | null;
  isActive: boolean;
  applicationStatus: string;
  verificationStatus?: string;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  showEmail: boolean;
  showWhatsapp: boolean;
  providerConsentConfirmed: boolean;
  removedAt?: Date | string | null;
  removedById?: string | null;
  removalReason?: string | null;
  createdAt?: Date | string;
  publishedProjectsCount?: number;
  _count: {
    projects: number;
    inquiries?: number;
    transactions?: number;
    supportTickets?: number;
  };
};

type ProviderRow = ProviderTableRow;

type FilterTab = "all" | "pending" | "active" | "inactive" | "rejected" | "removed";

function isProviderConfirmMatch(
  typed: string,
  provider: ProviderRow | null | undefined
): boolean {
  if (!provider) return false;
  const t = typed.trim().toLowerCase();
  if (!t) return false;
  const name = provider.displayName.trim().toLowerCase();
  const email = (provider.email || "").trim().toLowerCase();
  return t === name || (Boolean(email) && t === email);
}

export function ProviderTable({
  providers: initial,
  currentAdminUserId,
}: {
  providers: ProviderRow[];
  currentAdminUserId?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [providers, setProviders] = useState<ProviderRow[]>(initial);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Detail & Reject modals (existing pending workflow)
  const [selectedProvider, setSelectedProvider] = useState<ProviderRow | null>(null);
  const [rejectModalProvider, setRejectModalProvider] = useState<ProviderRow | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Phase 2A: Deactivate confirmation modal
  const [deactivateModalProvider, setDeactivateModalProvider] = useState<ProviderRow | null>(null);
  const [deactivateReason, setDeactivateReason] = useState("");

  // Phase 2B: "⋯" menu & Remove provider modal
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [openMenuPos, setOpenMenuPos] = useState<{ id: string; top: number; left: number } | null>(null);
  const [removeModalProvider, setRemoveModalProvider] = useState<ProviderRow | null>(null);
  const [removeReason, setRemoveReason] = useState("");
  const [removeConfirmName, setRemoveConfirmName] = useState("");
  const [notifyPartnerByEmail, setNotifyPartnerByEmail] = useState(true);

  // Phase 2B: Permanent delete modal (only from Removed tab)
  const [deleteModalProvider, setDeleteModalProvider] = useState<ProviderRow | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  // Close ⋯ menu on scroll or click outside
  useEffect(() => {
    if (!openMenuId) return;
    const handleScroll = () => {
      setOpenMenuId(null);
      setOpenMenuPos(null);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [openMenuId]);

  // Counts per tab ("All Providers" excludes removed ones per Phase 2B)
  const nonRemoved = providers.filter((p) => !p.removedAt);
  const removedProviders = providers.filter((p) => Boolean(p.removedAt));
  const pendingCount = nonRemoved.filter((p) => p.applicationStatus === "pending").length;
  const activeCount = nonRemoved.filter(
    (p) => p.isActive && p.applicationStatus === "approved"
  ).length;
  const inactiveCount = nonRemoved.filter(
    (p) =>
      (!p.isActive ||
        p.applicationStatus === "deactivated" ||
        p.applicationStatus === "suspended") &&
      p.applicationStatus !== "pending" &&
      p.applicationStatus !== "rejected"
  ).length;
  const rejectedCount = nonRemoved.filter((p) => p.applicationStatus === "rejected").length;
  const removedCount = removedProviders.length;

  const searchLower = search.trim().toLowerCase();
  const filteredProviders = providers.filter((p) => {
    if (activeTab === "removed") {
      if (!p.removedAt) return false;
    } else {
      if (p.removedAt) return false;
      if (activeTab === "pending" && p.applicationStatus !== "pending") return false;
      if (activeTab === "active" && !(p.isActive && p.applicationStatus === "approved")) return false;
      if (activeTab === "inactive") {
        const isInactive =
          (!p.isActive ||
            p.applicationStatus === "deactivated" ||
            p.applicationStatus === "suspended") &&
          p.applicationStatus !== "pending" &&
          p.applicationStatus !== "rejected";
        if (!isInactive) return false;
      }
      if (activeTab === "rejected" && p.applicationStatus !== "rejected") return false;
    }

    if (searchLower) {
      const matchName = p.displayName.toLowerCase().includes(searchLower);
      const matchEmail = p.email.toLowerCase().includes(searchLower);
      const matchPhone = (p.whatsappNumber || "").toLowerCase().includes(searchLower);
      const matchLocation = (p.location || "").toLowerCase().includes(searchLower);
      return matchName || matchEmail || matchPhone || matchLocation;
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProviders.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedProviders = filteredProviders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ── Phase 2A: Single-click Activate or Confirmed Deactivate ────────────────
  async function handleToggleActive(provider: ProviderRow, targetActive: boolean, reason?: string) {
    setLoadingId(provider.id);
    try {
      const res = await fetch(`/api/admin/providers/${provider.id}/lifecycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          targetActive,
          reason,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast({
          variant: data.conflict ? "warning" : "error",
          title: data.conflict ? "State Already Changed" : "Action Failed",
          message: data.error || "Could not update provider status.",
        });
        router.refresh();
        return;
      }

      setProviders((prev) =>
        prev.map((p) =>
          p.id === provider.id
            ? {
                ...p,
                isActive: targetActive,
                applicationStatus: targetActive ? "approved" : "deactivated",
                verificationStatus: targetActive ? "verified" : p.verificationStatus,
              }
            : p
        )
      );
      setDeactivateModalProvider(null);
      setDeactivateReason("");
      toast({
        variant: "success",
        message:
          data.message ||
          `Partner "${provider.displayName}" has been ${targetActive ? "activated" : "deactivated"}.`,
      });
      router.refresh();
    } catch {
      toast({
        variant: "error",
        message: "Network error while updating provider status.",
      });
    } finally {
      setLoadingId(null);
    }
  }

  // ── Existing Pending / Rejected Approval Workflow ─────────────────────────
  async function handleApprovePendingOrRejected(provider: ProviderRow) {
    setLoadingId(provider.id);
    try {
      // Use the audited status endpoint (atomic: status + user role + audit record).
      const res = await fetch(`/api/admin/providers/${provider.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationStatus: "approved",
          verificationStatus: "verified",
          rejectionReason: null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          variant: "error",
          message: data.error || "Failed to approve provider.",
        });
        return;
      }

      setProviders((prev) =>
        prev.map((p) =>
          p.id === provider.id
            ? {
                ...p,
                isActive: true,
                applicationStatus: "approved",
                verificationStatus: "verified",
                rejectionReason: null,
              }
            : p
        )
      );
      if (selectedProvider?.id === provider.id) {
        setSelectedProvider((prev) =>
          prev
            ? { ...prev, isActive: true, applicationStatus: "approved", verificationStatus: "verified" }
            : null
        );
      }
      toast({
        variant: "success",
        message: `Partner "${provider.displayName}" has been approved and activated.`,
      });
      router.refresh();
    } catch {
      toast({ variant: "error", message: "Network error while approving provider." });
    } finally {
      setLoadingId(null);
    }
  }

  async function handleRejectConfirm() {
    if (!rejectModalProvider) return;
    setLoadingId(rejectModalProvider.id);
    try {
      // Use the audited status endpoint (atomic: status + project drafting + audit record).
      const res = await fetch(`/api/admin/providers/${rejectModalProvider.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationStatus: "rejected",
          verificationStatus: "rejected",
          rejectionReason: rejectionReason.trim() || "Application did not meet platform criteria.",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          variant: "error",
          message: data.error || "Failed to reject application.",
        });
        return;
      }

      const targetName = rejectModalProvider.displayName;
      setProviders((prev) =>
        prev.map((p) =>
          p.id === rejectModalProvider.id
            ? {
                ...p,
                isActive: false,
                applicationStatus: "rejected",
                rejectionReason:
                  rejectionReason.trim() || "Application did not meet platform criteria.",
              }
            : p
        )
      );
      setRejectModalProvider(null);
      setRejectionReason("");
      setSelectedProvider(null);
      toast({
        variant: "info",
        message: `Application for "${targetName}" has been marked as rejected.`,
      });
      router.refresh();
    } catch {
      toast({ variant: "error", message: "Network error while rejecting provider." });
    } finally {
      setLoadingId(null);
    }
  }

  // ── Phase 2B: Soft Remove Provider ────────────────────────────────────────
  async function handleRemoveProviderConfirm() {
    if (!removeModalProvider) return;
    setLoadingId(removeModalProvider.id);
    try {
      const res = await fetch(`/api/admin/providers/${removeModalProvider.id}/lifecycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove",
          reason: removeReason.trim(),
          confirmName: removeConfirmName.trim(),
          notifyPartner: notifyPartnerByEmail,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast({
          variant: "error",
          message: data.error || "Failed to remove provider.",
        });
        return;
      }

      const removedId = removeModalProvider.id;
      const removedName = removeModalProvider.displayName;
      setProviders((prev) =>
        prev.map((p) =>
          p.id === removedId
            ? {
                ...p,
                isActive: false,
                removedAt: new Date().toISOString(),
                removalReason: removeReason.trim(),
              }
            : p
        )
      );
      setRemoveModalProvider(null);
      setRemoveReason("");
      setRemoveConfirmName("");
      toast({
        variant: "success",
        message: data.message || `Provider "${removedName}" has been removed.`,
      });
      router.refresh();
    } catch {
      toast({ variant: "error", message: "Network error while removing provider." });
    } finally {
      setLoadingId(null);
    }
  }

  // ── Phase 2B: Restore Removed Provider ────────────────────────────────────
  async function handleRestoreProvider(provider: ProviderRow) {
    setLoadingId(provider.id);
    try {
      const res = await fetch(`/api/admin/providers/${provider.id}/lifecycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore" }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast({
          variant: "error",
          message: data.error || "Failed to restore provider.",
        });
        return;
      }

      setProviders((prev) =>
        prev.map((p) =>
          p.id === provider.id
            ? {
                ...p,
                removedAt: null,
                removedById: null,
                removalReason: null,
                isActive: true,
                applicationStatus: "approved",
              }
            : p
        )
      );
      toast({
        variant: "success",
        message: data.message || `Provider "${provider.displayName}" has been restored.`,
      });
      router.refresh();
    } catch {
      toast({ variant: "error", message: "Network error while restoring provider." });
    } finally {
      setLoadingId(null);
    }
  }

  // ── Phase 2B: Permanent Delete Provider ───────────────────────────────────
  async function handlePermanentDeleteConfirm() {
    if (!deleteModalProvider) return;
    setLoadingId(deleteModalProvider.id);
    try {
      const res = await fetch(`/api/admin/providers/${deleteModalProvider.id}/lifecycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "permanent_delete",
          confirmName: deleteConfirmName.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast({
          variant: "error",
          message: data.error || "Failed to permanently delete provider.",
        });
        return;
      }

      const deletedId = deleteModalProvider.id;
      const deletedName = deleteModalProvider.displayName;
      setProviders((prev) => prev.filter((p) => p.id !== deletedId));
      setDeleteModalProvider(null);
      setDeleteConfirmName("");
      toast({
        variant: "success",
        message: data.message || `Provider "${deletedName}" has been permanently deleted.`,
      });
      router.refresh();
    } catch {
      toast({ variant: "error", message: "Network error while deleting provider." });
    } finally {
      setLoadingId(null);
    }
  }

  function renderStatusBadge(p: ProviderRow) {
    if (p.removedAt) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-rose-100 text-rose-900 border border-rose-300">
          <Trash2 className="w-3.5 h-3.5 text-rose-700" />
          Removed
        </span>
      );
    }
    if (p.applicationStatus === "pending") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <Clock className="w-3.5 h-3.5 text-amber-700" />
          Pending Review
        </span>
      );
    }
    if (p.applicationStatus === "rejected") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          Rejected
        </span>
      );
    }
    if (p.isActive && p.applicationStatus === "approved") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-[#DDF4EC] text-[#2F7D78] border border-[#2F7D78]/20">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2F7D78]" />
          Active & Approved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-[#F3F7F7] text-[#526267] border border-[#D9E2E4]">
        <Ban className="w-3.5 h-3.5 text-[#526267]" />
        Inactive
      </span>
    );
  }

  const parseArrayField = (val: unknown): string[] => {
    if (Array.isArray(val)) return val.map(String);
    return [];
  };

  return (
    <div className="space-y-4">
      {/* Search Bar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-[#526267] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by provider, email, WhatsApp, or location..."
            className="w-full h-10 pl-10 pr-9 bg-white border border-[#D9E2E4] text-[#102124] rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#155761] placeholder:text-[#526267] shadow-2xs transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#526267] hover:text-[#102124] p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === "all"
                ? "bg-[#155761] text-white shadow-xs"
                : "bg-white text-[#526267] border border-[#D9E2E4] hover:text-[#102124]"
            }`}
          >
            All Providers ({nonRemoved.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("pending");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "pending"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-[#526267] border border-[#D9E2E4] hover:text-[#102124]"
            }`}
          >
            <span>Pending Applications</span>
            {pendingCount > 0 && (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "pending" ? "bg-white text-amber-800" : "bg-amber-100 text-amber-900"
                }`}
              >
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("active");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === "active"
                ? "bg-[#2F7D78] text-white shadow-xs"
                : "bg-white text-[#526267] border border-[#D9E2E4] hover:text-[#102124]"
            }`}
          >
            Active & Approved ({activeCount})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("inactive");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === "inactive"
                ? "bg-[#526267] text-white shadow-xs"
                : "bg-white text-[#526267] border border-[#D9E2E4] hover:text-[#102124]"
            }`}
          >
            Inactive / Deactivated ({inactiveCount})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("rejected");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
              activeTab === "rejected"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white text-[#526267] border border-[#D9E2E4] hover:text-[#102124]"
            }`}
          >
            Rejected ({rejectedCount})
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("removed");
              setPage(1);
            }}
            data-testid="providers-tab-removed"
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === "removed"
                ? "bg-rose-800 text-white shadow-xs"
                : "bg-white text-[#526267] border border-[#D9E2E4] hover:text-[#102124]"
            }`}
          >
            <span>Removed</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeTab === "removed" ? "bg-white text-rose-900" : "bg-rose-100 text-rose-900"
              }`}
            >
              {removedCount}
            </span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#D9E2E4] rounded-2xl overflow-visible shadow-xs">
        <div className="overflow-x-auto min-h-[160px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#D9E2E4] bg-[#F8FAFA] text-[#526267] text-left text-xs uppercase tracking-wider">
                <th className="px-5 py-3.5 font-semibold">Provider / Partner</th>
                <th className="px-4 py-3.5 font-semibold">Contact Info</th>
                <th className="px-4 py-3.5 font-semibold">Projects</th>
                <th className="px-4 py-3.5 font-semibold">Account Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E2E4]">
              {paginatedProviders.map((p) => {
                const spec = getProviderStatusButtonSpec(p, currentAdminUserId);
                const isBusy = loadingId === p.id;
                const publishedCount = p.publishedProjectsCount ?? p._count.projects;

                return (
                  <tr
                    key={p.id}
                    className={`hover:bg-[#F3F7F7]/50 transition-colors ${
                      p.applicationStatus === "pending" && !p.removedAt ? "bg-amber-50/20" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#102124]">{p.displayName}</span>
                        {p.userId && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F3F7F7] text-[#155761] font-semibold border border-[#D9E2E4]">
                            Partner Portal
                          </span>
                        )}
                        {currentAdminUserId && p.userId === currentAdminUserId && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                            Your Account
                          </span>
                        )}
                      </div>
                      {p.location && (
                        <p className="text-xs text-[#526267] mt-0.5">{p.location}</p>
                      )}
                      {p.removedAt && p.removalReason && (
                        <p className="text-[11px] text-rose-700 mt-1">
                          Removed reason: {p.removalReason}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-[#102124] font-medium text-xs">{p.email}</div>
                      {p.whatsappNumber && (
                        <div className="text-[11px] text-[#526267] mt-0.5">
                          WA: {p.whatsappNumber}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4 text-[#526267] font-semibold">
                      {p._count.projects}
                    </td>

                    <td className="px-4 py-4">{renderStatusBadge(p)}</td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2 flex-wrap relative">
                        {/* View Details */}
                        <button
                          type="button"
                          onClick={() => setSelectedProvider(p)}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-[#F3F7F7] hover:bg-[#D9E2E4]/60 text-[#102124] rounded-lg transition font-medium cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        {/* Edit Link (hidden for removed providers) */}
                        {!p.removedAt && (
                          <Link
                            href={`/admin/providers/${p.id}/edit`}
                            className="text-xs px-2.5 py-1.5 bg-[#F3F7F7] hover:bg-[#155761] hover:text-white text-[#102124] rounded-lg transition font-medium"
                          >
                            Edit
                          </Link>
                        )}

                        {/* Phase 2A: Single state-aware status action */}
                        {spec.state === "PENDING" && (
                          <>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleApprovePendingOrRejected(p)}
                              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-[#2F7D78] hover:bg-[#256662] text-white rounded-lg transition font-bold cursor-pointer disabled:opacity-50 shadow-xs"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{isBusy ? "Approving…" : "Approve"}</span>
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => {
                                setRejectModalProvider(p);
                                setRejectionReason("");
                              }}
                              className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition font-semibold cursor-pointer disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}

                        {spec.state === "REJECTED" && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleApprovePendingOrRejected(p)}
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-[#DDF4EC] hover:bg-[#2F7D78] text-[#2F7D78] hover:text-white rounded-lg transition font-bold cursor-pointer disabled:opacity-50"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{isBusy ? "Approving…" : "Re-approve"}</span>
                          </button>
                        )}

                        {spec.state === "ACTIVE_APPROVED" && (
                          <button
                            type="button"
                            data-testid={`provider-status-btn-${p.id}`}
                            disabled={isBusy || spec.disabled}
                            title={spec.disabledReason}
                            onClick={() => {
                              setDeactivateModalProvider(p);
                              setDeactivateReason("");
                            }}
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 rounded-lg transition font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Ban className="w-3.5 h-3.5" />
                            )}
                            <span>Deactivate</span>
                          </button>
                        )}

                        {spec.state === "INACTIVE" && (
                          <button
                            type="button"
                            data-testid={`provider-status-btn-${p.id}`}
                            disabled={isBusy || spec.disabled}
                            title={spec.disabledReason}
                            onClick={() => handleToggleActive(p, true)}
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#2F7D78] hover:bg-[#256662] text-white rounded-lg transition font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Power className="w-3.5 h-3.5" />
                            )}
                            <span>{isBusy ? "Activating…" : "Activate"}</span>
                          </button>
                        )}

                        {spec.state === "REMOVED" && (
                          <>
                            <button
                              type="button"
                              data-testid={`provider-status-btn-${p.id}`}
                              disabled={isBusy}
                              onClick={() => handleRestoreProvider(p)}
                              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white hover:bg-[#F3F7F7] text-[#102124] border border-[#D9E2E4] rounded-lg transition font-semibold cursor-pointer disabled:opacity-50"
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3.5 h-3.5" />
                              )}
                              <span>Restore</span>
                            </button>

                            {activeTab === "removed" && (
                              <button
                                type="button"
                                data-testid={`provider-perm-delete-btn-${p.id}`}
                                disabled={isBusy || !spec.canPermanentDelete}
                                title={spec.permanentDeleteDisabledReason}
                                onClick={() => {
                                  setDeleteModalProvider(p);
                                  setDeleteConfirmName("");
                                }}
                                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete permanently</span>
                              </button>
                            )}
                          </>
                        )}

                        {/* Phase 2B: "⋯" More menu with Remove provider… */}
                        {!p.removedAt && (
                          <div className="relative" data-testid="provider-more-container">
                            <button
                              type="button"
                              aria-label="More provider actions"
                              data-testid={`provider-more-btn-${p.id}`}
                              onClick={(e) => {
                                if (openMenuId === p.id) {
                                  setOpenMenuId(null);
                                  setOpenMenuPos(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const openUpward = rect.bottom + 65 > window.innerHeight;
                                  setOpenMenuId(p.id);
                                  setOpenMenuPos({
                                    id: p.id,
                                    top: openUpward ? rect.top - 46 : rect.bottom + 4,
                                    left: Math.max(12, rect.right - 192),
                                  });
                                }
                              }}
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition cursor-pointer ${
                                openMenuId === p.id
                                  ? "border-[#155761] bg-[#F3F7F7] text-[#155761]"
                                  : "border-[#D9E2E4] bg-white hover:bg-[#F3F7F7] text-[#526267] hover:text-[#102124]"
                              }`}
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Invisible published count marker for testing */}
                        <span className="sr-only" data-published-count={publishedCount} />
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProviders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[#526267]">
                    No providers found in this view.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredProviders.length > 0 && (
          <div className="p-4 border-t border-[#D9E2E4] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#526267]">
            <div>
              Showing <span className="font-semibold text-[#102124]">{(currentPage - 1) * pageSize + 1}</span>–
              <span className="font-semibold text-[#102124]">{Math.min(currentPage * pageSize, filteredProviders.length)}</span> of{" "}
              <span className="font-semibold text-[#102124]">{filteredProviders.length}</span> providers
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
      </div>

      {/* Floating 3-dots actions menu (Rendered outside table to prevent any scrollbars) */}
      {openMenuId && openMenuPos && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => {
              setOpenMenuId(null);
              setOpenMenuPos(null);
            }}
          />
          <div
            style={{ top: `${openMenuPos.top}px`, left: `${openMenuPos.left}px` }}
            className="fixed w-48 bg-white border border-[#D9E2E4] rounded-xl shadow-xl py-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100"
            data-testid="provider-more-dropdown"
          >
            {(() => {
              const p = providers.find((pr) => pr.id === openMenuId);
              if (!p) return null;
              const spec = getProviderStatusButtonSpec(p, currentAdminUserId);
              return (
                <button
                  type="button"
                  disabled={!spec.canRemove}
                  title={
                    !spec.canRemove
                      ? "Cannot remove a provider linked to your own admin account."
                      : undefined
                  }
                  onClick={() => {
                    setOpenMenuId(null);
                    setOpenMenuPos(null);
                    setRemoveModalProvider(p);
                    setRemoveReason("");
                    setRemoveConfirmName("");
                    setNotifyPartnerByEmail(true);
                  }}
                  className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove provider…</span>
                </button>
              );
            })()}
          </div>
        </>
      )}

      {/* ── Phase 2A: Deactivate Confirmation Modal ───────────────────────── */}
      {deactivateModalProvider && (
        <div className="fixed inset-0 z-50 bg-[#102124]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="deactivate-provider-title"
            className="bg-white rounded-3xl border border-[#D9E2E4] max-w-md w-full p-6 sm:p-8 shadow-xl space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 id="deactivate-provider-title" className="text-lg font-bold text-[#102124]">
                  Deactivate Provider
                </h3>
                <p className="text-xs text-[#526267]">{deactivateModalProvider.displayName}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
              {deactivateModalProvider.publishedProjectsCount ??
                deactivateModalProvider._count.projects}{" "}
              published{" "}
              {(deactivateModalProvider.publishedProjectsCount ??
                deactivateModalProvider._count.projects) === 1
                ? "project"
                : "projects"}{" "}
              will be hidden from the site while this provider is inactive.
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102124] uppercase tracking-wider mb-1.5">
                Reason (Optional, max 300 chars)
              </label>
              <textarea
                rows={3}
                maxLength={300}
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value.slice(0, 300))}
                placeholder="Optional note for the audit log…"
                className="w-full rounded-xl border border-[#D9E2E4] bg-[#F8FAFA] p-3 text-sm text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
              />
              <p className="text-[11px] text-[#526267] mt-1 text-right">
                {deactivateReason.length}/300
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeactivateModalProvider(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={loadingId === deactivateModalProvider.id}
                onClick={() =>
                  handleToggleActive(deactivateModalProvider, false, deactivateReason)
                }
              >
                {loadingId === deactivateModalProvider.id ? "Deactivating…" : "Deactivate"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Phase 2B: Remove Provider Modal ───────────────────────────────── */}
      {removeModalProvider && (
        <div className="fixed inset-0 z-50 bg-[#102124]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-provider-title"
            className="bg-white rounded-3xl border border-[#D9E2E4] max-w-lg w-full p-6 sm:p-8 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 id="remove-provider-title" className="text-lg font-bold text-[#102124]">
                  Remove Provider
                </h3>
                <p className="text-xs text-[#526267]">
                  Soft-remove <strong>{removeModalProvider.displayName}</strong> from all public surfaces
                </p>
              </div>
            </div>

            {/* Impact counts */}
            <div className="bg-[#F8FAFA] border border-[#D9E2E4] rounded-2xl p-4 space-y-2">
              <p className="text-xs font-bold text-[#102124] uppercase tracking-wider">
                Impact Summary
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-white border border-[#D9E2E4] rounded-xl p-2.5">
                  <div className="text-base font-bold text-[#102124]">
                    {removeModalProvider._count.projects ?? 0}
                  </div>
                  <div className="text-[11px] text-[#526267]">Projects Hidden</div>
                </div>
                <div className="bg-white border border-[#D9E2E4] rounded-xl p-2.5">
                  <div className="text-base font-bold text-[#102124]">
                    {removeModalProvider._count.inquiries ?? 0}
                  </div>
                  <div className="text-[11px] text-[#526267]">Inquiries Kept</div>
                </div>
                <div className="bg-white border border-[#D9E2E4] rounded-xl p-2.5">
                  <div className="text-base font-bold text-[#102124]">
                    {removeModalProvider._count.transactions ?? 0}
                  </div>
                  <div className="text-[11px] text-[#526267]">Transactions Kept</div>
                </div>
                <div className="bg-white border border-[#D9E2E4] rounded-xl p-2.5">
                  <div className="text-base font-bold text-[#102124]">
                    {removeModalProvider._count.supportTickets ?? 0}
                  </div>
                  <div className="text-[11px] text-[#526267]">Tickets Kept</div>
                </div>
              </div>
              <p className="text-[11px] text-[#526267] leading-relaxed pt-1">
                All projects will disappear from public listings, search, featured sections, and sitemap. Partner portal sessions will be invalidated immediately while historical records remain intact.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102124] uppercase tracking-wider mb-1.5">
                Reason for Removal <span className="text-[#526267] font-normal normal-case">(optional)</span>
              </label>
              <textarea
                rows={3}
                value={removeReason}
                onChange={(e) => setRemoveReason(e.target.value)}
                placeholder="Optional: Explain why this provider is being removed…"
                className="w-full rounded-xl border border-[#D9E2E4] bg-[#F8FAFA] p-3 text-sm text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102124] mb-1.5">
                Confirm Provider <span className="text-[#526267] font-normal normal-case">(optional — <span className="font-mono text-rose-600 font-bold">{removeModalProvider.displayName}</span>)</span>
              </label>
              <input
                type="text"
                value={removeConfirmName}
                onChange={(e) => setRemoveConfirmName(e.target.value)}
                placeholder={removeModalProvider.displayName}
                className="w-full rounded-xl border border-[#D9E2E4] bg-white px-3.5 py-2 text-sm text-[#102124] focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <label className="flex items-center gap-2.5 text-xs font-medium text-[#102124] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={notifyPartnerByEmail}
                onChange={(e) => setNotifyPartnerByEmail(e.target.checked)}
                className="rounded border-[#D9E2E4] text-[#155761] focus:ring-[#155761]"
              />
              <span>Notify the partner by email ({removeModalProvider.email})</span>
            </label>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRemoveModalProvider(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={
                  loadingId === removeModalProvider.id ||
                  (Boolean(removeConfirmName.trim()) && !isProviderConfirmMatch(removeConfirmName, removeModalProvider))
                }
                onClick={handleRemoveProviderConfirm}
              >
                {loadingId === removeModalProvider.id ? "Removing…" : "Remove provider"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Phase 2B: Permanent Delete Modal (Removed tab only) ───────────── */}
      {deleteModalProvider && (
        <div className="fixed inset-0 z-50 bg-[#102124]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="perm-delete-provider-title"
            className="bg-white rounded-3xl border border-[#D9E2E4] max-w-md w-full p-6 sm:p-8 shadow-xl space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 border border-rose-300 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 id="perm-delete-provider-title" className="text-lg font-bold text-[#102124]">
                  Permanently Delete Provider
                </h3>
                <p className="text-xs text-rose-700 font-semibold">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#526267] leading-relaxed">
              This will permanently delete <strong>{deleteModalProvider.displayName}</strong> and{" "}
              <strong>{deleteModalProvider._count.projects}</strong> associated project(s) and image metadata in a single transaction. A snapshot will be recorded in the audit log.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#102124] mb-1.5">
                Type <span className="font-mono text-rose-600 font-bold">{deleteModalProvider.displayName}</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder={deleteModalProvider.displayName}
                className="w-full rounded-xl border border-[#D9E2E4] bg-white px-3.5 py-2 text-sm text-[#102124] focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalProvider(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={
                  loadingId === deleteModalProvider.id ||
                  !isProviderConfirmMatch(deleteConfirmName, deleteModalProvider)
                }
                onClick={handlePermanentDeleteConfirm}
              >
                {loadingId === deleteModalProvider.id ? "Deleting…" : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 bg-[#102124]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D9E2E4] max-w-2xl w-full p-6 sm:p-8 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-[#D9E2E4] pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-[#102124]">
                    {selectedProvider.displayName}
                  </h2>
                  {renderStatusBadge(selectedProvider)}
                </div>
                <p className="text-xs text-[#526267] mt-1">
                  Registered Email: <strong>{selectedProvider.email}</strong>
                  {selectedProvider.whatsappNumber
                    ? ` • WhatsApp: ${selectedProvider.whatsappNumber}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProvider(null)}
                className="text-xs font-bold text-[#526267] hover:text-[#102124] px-2.5 py-1 rounded-lg bg-[#F3F7F7]"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs text-[#102124]">
              {selectedProvider.bio && (
                <div>
                  <span className="text-[#8A9B9F] font-semibold uppercase tracking-wider block mb-1">
                    Professional Bio / Studio Summary
                  </span>
                  <p className="bg-[#F8FAFA] p-3.5 rounded-xl border border-[#D9E2E4] text-[#526267] leading-relaxed">
                    {selectedProvider.bio}
                  </p>
                </div>
              )}

              {selectedProvider.solutionsOffered && (
                <div>
                  <span className="text-[#8A9B9F] font-semibold uppercase tracking-wider block mb-1">
                    Solutions Offered
                  </span>
                  <p className="bg-[#F8FAFA] p-3.5 rounded-xl border border-[#D9E2E4] text-[#526267] leading-relaxed">
                    {selectedProvider.solutionsOffered}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[#8A9B9F] font-semibold uppercase tracking-wider block mb-1">
                    Core Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parseArrayField(selectedProvider.skills).length > 0 ? (
                      parseArrayField(selectedProvider.skills).map((skill) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 rounded-lg bg-[#F3F7F7] text-[#155761] font-medium border border-[#D9E2E4]"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-[#8A9B9F]">Not specified</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[#8A9B9F] font-semibold uppercase tracking-wider block mb-1">
                    Technologies
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parseArrayField(selectedProvider.technologies).length > 0 ? (
                      parseArrayField(selectedProvider.technologies).map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-1 rounded-lg bg-[#F3F7F7] text-[#102124] font-medium border border-[#D9E2E4]"
                        >
                          {tech}
                        </span>
                      ))
                    ) : (
                      <span className="text-[#8A9B9F]">Not specified</span>
                    )}
                  </div>
                </div>
              </div>

              {(selectedProvider.portfolioUrl ||
                selectedProvider.githubUrl ||
                selectedProvider.linkedinUrl) && (
                <div className="pt-2 border-t border-[#D9E2E4] flex flex-wrap gap-4">
                  {selectedProvider.portfolioUrl && (
                    <a
                      href={selectedProvider.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#155761] font-semibold hover:underline"
                    >
                      <span>Portfolio Website</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedProvider.githubUrl && (
                    <a
                      href={selectedProvider.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#155761] font-semibold hover:underline"
                    >
                      <span>GitHub Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {selectedProvider.linkedinUrl && (
                    <a
                      href={selectedProvider.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#155761] font-semibold hover:underline"
                    >
                      <span>LinkedIn Profile</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}

              {selectedProvider.rejectionReason && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                  <strong>Rejection Reason:</strong> {selectedProvider.rejectionReason}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#D9E2E4]">
              {!selectedProvider.removedAt ? (
                <Link
                  href={`/admin/providers/${selectedProvider.id}/edit`}
                  className="text-xs font-semibold text-[#155761] hover:underline"
                >
                  Open Full Provider Settings →
                </Link>
              ) : (
                <span className="text-xs text-rose-700 font-semibold">Removed provider</span>
              )}

              <div className="flex items-center gap-2">
                {selectedProvider.applicationStatus === "pending" && !selectedProvider.removedAt && (
                  <>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setRejectModalProvider(selectedProvider);
                        setRejectionReason("");
                      }}
                    >
                      Reject Application
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={loadingId === selectedProvider.id}
                      onClick={() => handleApprovePendingOrRejected(selectedProvider)}
                    >
                      {loadingId === selectedProvider.id ? "Approving…" : "Approve & Activate Partner"}
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={() => setSelectedProvider(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalProvider && (
        <div className="fixed inset-0 z-50 bg-[#102124]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D9E2E4] max-w-md w-full p-6 sm:p-8 shadow-xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#102124]">Reject Partner Application</h3>
                <p className="text-xs text-[#526267]">{rejectModalProvider.displayName}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102124] uppercase tracking-wider mb-1.5">
                Reviewer Feedback / Reason
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide feedback explaining why this application was not approved..."
                className="w-full rounded-xl border border-[#D9E2E4] bg-[#F8FAFA] p-3 text-sm text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectModalProvider(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={loadingId === rejectModalProvider.id}
                onClick={handleRejectConfirm}
              >
                {loadingId === rejectModalProvider.id ? "Rejecting…" : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProviderTable;
