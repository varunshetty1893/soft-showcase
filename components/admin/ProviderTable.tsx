// components/admin/ProviderTable.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  UserX,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  MessageCircle,
  Mail,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";

export interface ProviderTableRow {
  id: string;
  displayName: string;
  email: string;
  whatsappNumber?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  providerConsentConfirmed: boolean;
  showEmail: boolean;
  showWhatsapp: boolean;
  applicationStatus?: string | null;
  verificationStatus?: string | null;
  _count?: {
    projects: number;
  };
}

interface ProviderTableProps {
  providers: ProviderTableRow[];
}

export function ProviderTable({ providers }: ProviderTableProps) {
  const router = useRouter();
  const [providerList, setProviderList] = React.useState<ProviderTableRow[]>(providers);
  const [filter, setFilter] = React.useState<"all" | "pending" | "approved" | "rejected" | "inactive">("all");
  const [deactivatingProvider, setDeactivatingProvider] = React.useState<ProviderTableRow | null>(null);
  const [rejectingProvider, setRejectingProvider] = React.useState<ProviderTableRow | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    setProviderList(providers);
  }, [providers]);

  const handleDeactivate = async () => {
    if (!deactivatingProvider) return;
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const targetId = deactivatingProvider.id;
    // Optimistic update
    setProviderList((prev) =>
      prev.map((p) =>
        p.id === targetId ? { ...p, isActive: false, applicationStatus: "deactivated" } : p
      )
    );

    try {
      const res = await fetch(`/api/admin/providers/${targetId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to deactivate provider");
      }

      setDeactivatingProvider(null);
      setSuccessMessage("Partner deactivated successfully.");
      router.refresh();
    } catch (err: unknown) {
      setProviderList(providers);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprovePartner = async (providerId: string) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const target = providerList.find((p) => p.id === providerId);
    // Optimistic update so the user immediately sees the active partner
    setProviderList((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? {
              ...p,
              applicationStatus: "approved",
              verificationStatus: "verified",
              isActive: true,
              showWhatsapp: true,
              showEmail: true,
              providerConsentConfirmed: true,
            }
          : p
      )
    );

    try {
      const res = await fetch(`/api/admin/providers/${providerId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationStatus: "approved",
          verificationStatus: "verified",
          isActive: true,
          showWhatsapp: true,
          showEmail: true,
          providerConsentConfirmed: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to approve partner");
      }

      setSuccessMessage(
        `Partner "${target?.displayName || "Partner"}" has been successfully activated and approved.`
      );
      router.refresh();
    } catch (err: unknown) {
      setProviderList(providers);
      setError(err instanceof Error ? err.message : "Failed to approve partner");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectPartner = async () => {
    if (!rejectingProvider) return;
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const targetId = rejectingProvider.id;
    // Optimistic update
    setProviderList((prev) =>
      prev.map((p) =>
        p.id === targetId ? { ...p, isActive: false, applicationStatus: "rejected" } : p
      )
    );

    try {
      const res = await fetch(`/api/admin/providers/${targetId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationStatus: "rejected",
          rejectionReason:
            rejectionReason.trim() ||
            "Application did not meet marketplace requirements at this time.",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to reject partner");
      }

      setRejectingProvider(null);
      setRejectionReason("");
      setSuccessMessage("Partner application rejected.");
      router.refresh();
    } catch (err: unknown) {
      setProviderList(providers);
      setError(err instanceof Error ? err.message : "Failed to reject partner");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProviders = providerList.filter((p) => {
    if (filter === "all") return true;
    if (filter === "pending") return p.applicationStatus === "pending";
    if (filter === "approved") return p.applicationStatus === "approved" && p.isActive;
    if (filter === "rejected") return p.applicationStatus === "rejected";
    if (filter === "inactive") return !p.isActive || p.applicationStatus === "deactivated";
    return true;
  });

  const pendingCount = providerList.filter((p) => p.applicationStatus === "pending").length;
  const inactiveCount = providerList.filter(
    (p) => !p.isActive || p.applicationStatus === "deactivated"
  ).length;

  if (providerList.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs">
        <h3 className="text-base font-bold text-gray-900">No Providers Found</h3>
        <p className="mt-1 text-xs text-gray-500">
          Get started by adding your first project provider or developer.
        </p>
        <div className="mt-6">
          <Link
            href="/admin/providers/new"
            className={buttonVariants({ size: "sm" })}
          >
            Add Provider
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Status filter tabs ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 pb-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            filter === "all"
              ? "bg-gray-900 text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          All Providers ({providerList.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter("pending")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            filter === "pending"
              ? "bg-amber-600 text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <span>Pending Applications</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilter("approved")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            filter === "approved"
              ? "bg-emerald-600 text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Approved Partners
        </button>

        <button
          type="button"
          onClick={() => setFilter("rejected")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            filter === "rejected"
              ? "bg-rose-600 text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Rejected
        </button>

        <button
          type="button"
          onClick={() => setFilter("inactive")}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            filter === "inactive"
              ? "bg-slate-800 text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <span>Inactive / Deactivated</span>
          {inactiveCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
              {inactiveCount}
            </span>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-600 hover:text-rose-800 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Provider / Partner</th>
                <th className="py-3.5 px-6">Contact Info</th>
                <th className="py-3.5 px-6">Partner Status</th>
                <th className="py-3.5 px-6">Consent</th>
                <th className="py-3.5 px-6">Solutions</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 text-xs">
              {filteredProviders.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {provider.avatarUrl ? (
                        <div className="relative w-9 h-9 rounded-full overflow-hidden border border-gray-200 shrink-0">
                          <Image
                            src={provider.avatarUrl}
                            alt={provider.displayName}
                            fill
                            sizes="36px"
                            className="object-cover"
                            referrerPolicy="no-referrer"
                            unoptimized={provider.avatarUrl.startsWith("data:")}
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] font-bold flex items-center justify-center text-xs">
                          {provider.displayName[0]?.toUpperCase() || "P"}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                          <span>{provider.displayName}</span>
                          {provider.verificationStatus === "verified" && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono truncate max-w-[140px]">
                          {provider.id}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>{provider.email}</span>
                      </div>
                      {provider.whatsappNumber && (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-mono">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{provider.whatsappNumber}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        provider.isActive && provider.applicationStatus === "approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : !provider.isActive
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : provider.applicationStatus === "pending"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : provider.applicationStatus === "rejected"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {provider.isActive && provider.applicationStatus === "approved"
                        ? "Active & Approved"
                        : !provider.isActive
                        ? "Inactive / Deactivated"
                        : provider.applicationStatus === "pending"
                        ? "Pending Review"
                        : provider.applicationStatus || "Active"}
                    </span>
                  </td>

                  <td className="py-4 px-6">
                    {provider.providerConsentConfirmed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <ShieldCheck className="w-3 h-3" />
                        Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <ShieldAlert className="w-3 h-3" />
                        Missing
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6 font-semibold text-gray-900">
                    {provider._count?.projects ?? 0}
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {provider.applicationStatus === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprovePartner(provider.id)}
                            isLoading={isSubmitting}
                            className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 cursor-pointer shadow-xs"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRejectingProvider(provider)}
                            className="h-8 px-2 text-xs text-rose-600 hover:bg-rose-50 border-rose-200 gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3 h-3" />
                            Reject
                          </Button>
                        </>
                      )}

                      {(!provider.isActive || provider.applicationStatus === "deactivated" || provider.applicationStatus === "rejected") && (
                        <Button
                          size="sm"
                          onClick={() => handleApprovePartner(provider.id)}
                          isLoading={isSubmitting}
                          className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 cursor-pointer shadow-xs"
                          title="Activate and approve this partner account"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Activate Partner
                        </Button>
                      )}

                      <Link
                        href={`/admin/providers/${provider.id}/edit`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                          className: "h-8 px-2.5 text-xs gap-1 cursor-pointer",
                        })}
                        title="View and edit partner details"
                      >
                        <Eye className="w-3 h-3 text-[#155761]" />
                        <span>View / Edit</span>
                      </Link>

                      {provider.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeactivatingProvider(provider)}
                          className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1 cursor-pointer"
                          title="Deactivate provider"
                        >
                          <UserX className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Reject Modal ───────────────────────────────────────────────── */}
      {rejectingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900">
              Reject Application: {rejectingProvider.displayName}?
            </h3>

            <p className="text-xs text-gray-600 leading-relaxed">
              Please specify the reason for rejection. This feedback will be displayed to the applicant on their status page.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete portfolio links or software does not meet current catalog requirements..."
              rows={3}
              className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRejectingProvider(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleRejectPartner}
                isLoading={isSubmitting}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Deactivation Confirmation Modal ─────────────────────────────── */}
      {deactivatingProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-gray-900">
              Deactivate Provider: {deactivatingProvider.displayName}?
            </h3>

            <div className="text-xs text-gray-600 space-y-2 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
              <p className="font-semibold text-gray-800">This action will:</p>
              <ul className="list-disc pl-4 space-y-1 text-gray-600">
                <li>Hide WhatsApp and contact buttons on all assigned projects.</li>
                <li>Prevent publishing new projects assigned to this provider.</li>
                <li>Preserve all historical projects and customer inquiries.</li>
              </ul>
            </div>

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeactivatingProvider(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeactivate}
                isLoading={isSubmitting}
              >
                Confirm Deactivation
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
