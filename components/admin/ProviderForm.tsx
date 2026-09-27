// components/admin/ProviderForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, ShieldCheck, AlertCircle } from "lucide-react";

interface ProviderFormData {
  id?: string;
  displayName: string;
  email: string;
  whatsappNumber?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  showEmail: boolean;
  showWhatsapp: boolean;
  providerConsentConfirmed: boolean;
}

interface ProviderFormProps {
  initialData?: ProviderFormData;
  mode: "create" | "edit";
}

export function ProviderForm({ initialData, mode }: ProviderFormProps) {
  const router = useRouter();

  const [formData, setFormData] = React.useState<ProviderFormData>({
    displayName: initialData?.displayName || "",
    email: initialData?.email || "",
    whatsappNumber: initialData?.whatsappNumber || "",
    bio: initialData?.bio || "",
    avatarUrl: initialData?.avatarUrl || "",
    isActive: initialData?.isActive ?? true,
    showEmail: initialData?.showEmail ?? false,
    showWhatsapp: initialData?.showWhatsapp ?? true,
    providerConsentConfirmed: initialData?.providerConsentConfirmed ?? false,
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const url =
      mode === "create"
        ? "/api/admin/providers"
        : `/api/admin/providers/${initialData?.id}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save provider");
      }

      router.push("/admin/providers");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to save provider</p>
            <p className="text-xs text-red-600 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* ── 1. Basic Information ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
          1. Provider Profile
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              required
              placeholder="e.g. Rahul Sharma"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="e.g. rahul@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <Input
              id="whatsappNumber"
              type="tel"
              placeholder="+919876543210 (with country code)"
              value={formData.whatsappNumber || ""}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              className="mt-1.5"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Required for the &quot;Discuss on WhatsApp&quot; button to appear on their projects.
            </p>
          </div>

          <div>
            <Label htmlFor="avatarUrl">Avatar Image URL (Optional)</Label>
            <Input
              id="avatarUrl"
              type="url"
              placeholder="https://..."
              value={formData.avatarUrl || ""}
              onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="bio">Provider Bio (Optional)</Label>
            <Textarea
              id="bio"
              rows={3}
              placeholder="Brief developer background, specialties, or agency intro..."
              value={formData.bio || ""}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      {/* ── 2. Visibility & Contact Toggles ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
          2. Contact Channels & Status
        </h3>

        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="mt-1 w-4 h-4 rounded border-[#D9E2E4] text-[#155761] focus:ring-[#155761]"
            />
            <div>
              <span className="text-sm font-semibold text-[#102124] block">
                Active Provider
              </span>
              <span className="text-xs text-[#526267]">
                If deactivated, contact buttons are hidden across all this provider’s projects.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showWhatsapp}
              onChange={(e) => setFormData({ ...formData, showWhatsapp: e.target.checked })}
              className="mt-1 w-4 h-4 rounded border-[#D9E2E4] text-[#155761] focus:ring-[#155761]"
            />
            <div>
              <span className="text-sm font-semibold text-[#102124] block">
                Enable WhatsApp Routing
              </span>
              <span className="text-xs text-[#526267]">
                Allow visitors to open a direct WhatsApp chat with this provider.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.showEmail}
              onChange={(e) => setFormData({ ...formData, showEmail: e.target.checked })}
              className="mt-1 w-4 h-4 rounded border-[#D9E2E4] text-[#155761] focus:ring-[#155761]"
            />
            <div>
              <span className="text-sm font-semibold text-[#102124] block">
                Enable Email Inquiries
              </span>
              <span className="text-xs text-[#526267]">
                Allow visitors to submit email inquiries routed to this provider.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* ── 3. Compliance & Consent ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#F3F7F7] pb-3">
          <ShieldCheck className="w-5 h-5 text-[#155761]" />
          <h3 className="text-base font-bold text-[#102124]">
            3. Mandatory Provider Consent
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 leading-relaxed space-y-2">
          <p className="font-semibold">Publication Requirement:</p>
          <p>
            Projects assigned to this provider <strong>cannot be published</strong> unless
            you confirm that this provider has explicitly agreed to have their projects
            listed and receive buyer inquiries.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={formData.providerConsentConfirmed}
            onChange={(e) =>
              setFormData({ ...formData, providerConsentConfirmed: e.target.checked })
            }
            className="mt-1 w-4 h-4 rounded border-[#D9E2E4] text-[#155761] focus:ring-[#155761]"
          />
          <div>
            <span className="text-sm font-semibold text-[#102124] block">
              Provider Consent Confirmed *
            </span>
            <span className="text-xs text-gray-600 leading-relaxed">
              I certify that I have obtained formal consent from this provider to list their
              software projects on Soft Showcase and route lead communications to their contact details.
            </span>
          </div>
        </label>
      </div>

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-4">
        <Link href="/admin/providers">
          <Button variant="outline" type="button" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Cancel
          </Button>
        </Link>

        <Button type="submit" size="lg" isLoading={isLoading} className="gap-2 shadow-sm">
          <Save className="w-4 h-4" />
          {mode === "create" ? "Create Provider" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
