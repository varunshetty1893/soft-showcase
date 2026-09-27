// components/admin/ProviderTable.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit2, UserX, AlertTriangle, ShieldCheck, ShieldAlert, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  _count?: {
    projects: number;
  };
}

interface ProviderTableProps {
  providers: ProviderTableRow[];
}

export function ProviderTable({ providers }: ProviderTableProps) {
  const router = useRouter();
  const [deactivatingProvider, setDeactivatingProvider] = React.useState<ProviderTableRow | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleDeactivate = async () => {
    if (!deactivatingProvider) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/providers/${deactivatingProvider.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to deactivate provider");
      }

      setDeactivatingProvider(null);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (providers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs">
        <h3 className="text-base font-bold text-gray-900">No Providers Found</h3>
        <p className="mt-1 text-xs text-gray-500">
          Get started by adding your first project provider or developer.
        </p>
        <div className="mt-6">
          <Link href="/admin/providers/new">
            <Button size="sm">Add Provider</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/75 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Provider</th>
                <th className="py-3.5 px-6">Contact Info</th>
                <th className="py-3.5 px-6">Consent</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Projects</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {providers.map((provider) => (
                <tr key={provider.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {provider.avatarUrl ? (
                        <img
                          src={provider.avatarUrl}
                          alt={provider.displayName}
                          className="w-9 h-9 rounded-full border border-gray-200 object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {provider.displayName[0]?.toUpperCase() || "P"}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-900">{provider.displayName}</div>
                        <div className="text-xs text-gray-400 font-mono truncate max-w-[140px]">
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
                    {provider.providerConsentConfirmed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Missing
                      </span>
                    )}
                  </td>

                  <td className="py-4 px-6">
                    {provider.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </td>

                  <td className="py-4 px-6 font-semibold text-gray-900">
                    {provider._count?.projects ?? 0}
                  </td>

                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/providers/${provider.id}/edit`}>
                        <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs gap-1">
                          <Edit2 className="w-3 h-3" />
                          Edit
                        </Button>
                      </Link>

                      {provider.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeactivatingProvider(provider)}
                          className="h-8 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
                          title="Deactivate provider"
                        >
                          <UserX className="w-3 h-3" />
                          Deactivate
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
