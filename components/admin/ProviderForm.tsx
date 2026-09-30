// components/admin/ProviderForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, ShieldCheck, AlertCircle, Lock, CheckCircle2 } from "lucide-react";

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

    // In edit mode, administrators control status & platform settings;
    // activating sets applicationStatus to approved and verificationStatus to verified.
    const payload =
      mode === "edit"
        ? {
            isActive: formData.isActive,
            applicationStatus: formData.isActive ? "approved" : "deactivated",
            verificationStatus: formData.isActive ? "verified" : "not_required",
            showEmail: formData.showEmail,
            showWhatsapp: formData.showWhatsapp,
            providerConsentConfirmed: formData.providerConsentConfirmed,
          }
        : formData;

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-800 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-rose-950">Unable to save provider</p>
            <p className="text-xs text-rose-700 leading-relaxed">
              {errorMessage === "FORBIDDEN"
                ? "Your session does not have administrative privileges. Please ensure your email is configured as ADMIN_EMAIL in Vercel settings and sign in again."
                : errorMessage}
            </p>
          </div>
        </div>
      )}

      {/* ── 1. Basic Information ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-gray-900">
            1. Provider Profile {mode === "edit" ? "(Read-Only)" : ""}
          </h3>
          {mode === "edit" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
              <Lock className="w-3 h-3 text-amber-700" />
              <span>Managed Exclusively by Provider</span>
            </span>
          )}
        </div>

        {mode === "edit" && (
          <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              Provider profile details (display name, email, WhatsApp, avatar, and bio) can only be changed by the Solution Partner in their Studio Settings. Administrators cannot alter partner profile information.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              required={mode === "create"}
              disabled={mode === "edit"}
              placeholder="e.g. Rahul Sharma"
              value={formData.displayName}
              onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
              className={`mt-1.5 ${
                mode === "edit" ? "bg-[#F8FAFA] text-[#526267] cursor-not-allowed border-dashed" : ""
              }`}
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              required={mode === "create"}
              disabled={mode === "edit"}
              placeholder="e.g. rahul@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`mt-1.5 ${
                mode === "edit" ? "bg-[#F8FAFA] text-[#526267] cursor-not-allowed border-dashed" : ""
              }`}
            />
          </div>

          <div>
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <Input
              id="whatsappNumber"
              type="tel"
              disabled={mode === "edit"}
              placeholder="+919876543210 (with country code)"
              value={formData.whatsappNumber || ""}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              className={`mt-1.5 ${
                mode === "edit" ? "bg-[#F8FAFA] text-[#526267] cursor-not-allowed border-dashed" : ""
              }`}
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
              disabled={mode === "edit"}
              placeholder="https://..."
              value={formData.avatarUrl || ""}
              onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              className={`mt-1.5 ${
                mode === "edit" ? "bg-[#F8FAFA] text-[#526267] cursor-not-allowed border-dashed" : ""
              }`}
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="bio">Provider Bio (Optional)</Label>
            <Textarea
              id="bio"
              rows={3}
              disabled={mode === "edit"}
              placeholder="Brief developer background, specialties, or agency intro..."
              value={formData.bio || ""}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className={`mt-1.5 ${
                mode === "edit" ? "bg-[#F8FAFA] text-[#526267] cursor-not-allowed border-dashed" : ""
              }`}
            />
          </div>
        </div>
      </div>

      {/* ── 2. Visibility & Contact Toggles ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-gray-900">
            2. Contact Channels &amp; Status
          </h3>
          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                isActive: true,
                showWhatsapp: true,
                showEmail: true,
                providerConsentConfirmed: true,
              }))
            }
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DDF4EC] text-[#155761] border border-[#2F7D78]/30 font-bold text-xs hover:bg-[#cceed6] transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2F7D78]" />
            <span>Approve &amp; Tick All 3 Channels</span>
          </button>
        </div>

        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => {
                const nextActive = e.target.checked;
                setFormData((prev) => ({
                  ...prev,
                  isActive: nextActive,
                  // If admin activates the provider, automatically tick all 3 channels + consent
                  ...(nextActive
                    ? {
                        showWhatsapp: true,
                        showEmail: true,
                        providerConsentConfirmed: true,
                      }
                    : {}),
                }));
              }}
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
        <Link
          href="/admin/providers"
          className={buttonVariants({
            variant: "outline",
            className: "gap-2",
          })}
        >
          <ArrowLeft className="w-4 h-4" />
          Cancel
        </Link>

        <Button type="submit" size="lg" isLoading={isLoading} className="gap-2 shadow-sm">
          <Save className="w-4 h-4" />
          {mode === "create" ? "Create Provider" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
