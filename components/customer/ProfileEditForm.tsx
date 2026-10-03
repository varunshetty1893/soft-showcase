// components/customer/ProfileEditForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Shield, CheckCircle2, AlertCircle, Loader2, Trash2, AlertTriangle, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordChangeForm } from "./PasswordChangeForm";

interface ProfileEditFormProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    whatsapp?: string | null;
    contactEmail?: string | null;
    image: string | null;
    isAdmin: boolean;
    createdAt: Date;
  };
}

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState(user.name || "");
  const [whatsapp, setWhatsapp] = React.useState(user.whatsapp || "");
  const [contactEmail, setContactEmail] = React.useState(
    user.contactEmail || user.email
  );

  // One-time migration from legacy localStorage if DB fields are empty
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user.whatsapp) {
      const legacyWa = localStorage.getItem(`customer_whatsapp_${user.id}`);
      if (legacyWa) setWhatsapp(legacyWa);
    }
    if (!user.contactEmail) {
      const legacyEmail = localStorage.getItem(`customer_contact_email_${user.id}`);
      if (legacyEmail) setContactEmail(legacyEmail);
    }
  }, [user.id, user.whatsapp, user.contactEmail]);

  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = React.useState("");
  const [deleteReason, setDeleteReason] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      setDeleteError("Confirmation email does not match your account email.");
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmEmail: deleteConfirmEmail.trim(),
          reason: deleteReason.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account");
      }
      // Successfully deleted — sign out and redirect
      await signOut({ callbackUrl: "/login?deleted=1" });
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account");
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: "error", text: "Display name cannot be empty." });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          whatsapp: whatsapp.trim() || null,
          contactEmail: contactEmail.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const fieldError =
          data?.details &&
          Object.values(data.details as Record<string, string[]>)[0]?.[0];
        throw new Error(fieldError || data.error || "Failed to update profile");
      }

      if (data.user) {
        setName(data.user.name || "");
        setWhatsapp(data.user.whatsapp || "");
        setContactEmail(data.user.contactEmail || data.user.email || user.email);
      }

      // Clean up legacy localStorage keys once persisted to DB
      if (typeof window !== "undefined") {
        localStorage.removeItem(`customer_whatsapp_${user.id}`);
        localStorage.removeItem(`customer_contact_email_${user.id}`);
      }

      setMessage({ type: "success", text: "Your profile details and contact preferences have been saved." });
      router.refresh();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const formattedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Edit Basic Info & Contact Preferences Card */}
      <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs">
        <h2 className="text-lg font-bold text-[#102124] mb-1">Personal &amp; Contact Information</h2>
        <p className="text-sm text-[#526267] mb-6">
          Update your public name, preferred WhatsApp number, and primary email for creator communications.
        </p>

        {message && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-start gap-3 text-sm ${
              message.type === "success"
                ? "bg-[#DDF4EC] border border-[#2F7D78]/25 text-[#155761]"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-[#2F7D78] shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-2">
              Display Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#526267] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="pl-10 text-sm"
                required
                minLength={2}
                maxLength={100}
              />
            </div>
            <p className="text-xs text-[#526267] mt-1.5">
              Your name displayed on inquiries and custom project orders.
            </p>
          </div>

          {/* Account Login Email (Locked) */}
          <div>
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-2">
              Account Login Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#526267] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="email"
                value={user.email}
                disabled
                className="pl-10 text-sm bg-[#F8FAFA] text-[#526267] cursor-not-allowed border-[#D9E2E4]"
              />
            </div>
            <p className="text-xs text-[#526267] mt-1.5">
              Primary authentication identifier linked to this account.
            </p>
          </div>

          {/* Preferred Contact WhatsApp Number */}
          <div>
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-2">
              WhatsApp Contact Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#2F7D78] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+91 98765 43210 (with country code)"
                className="pl-10 text-sm"
              />
            </div>
            <p className="text-xs text-[#526267] mt-1.5">
              Used to connect with project builders directly for rapid handovers and live demos.
            </p>
          </div>

          {/* Preferred Communication Email */}
          <div>
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-2">
              Alternative / Inquiry Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#526267] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="secondary@example.com"
                className="pl-10 text-sm"
              />
            </div>
            <p className="text-xs text-[#526267] mt-1.5">
              Where project creators send code repositories, documents, and technical proposals.
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="gap-2 px-6"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile Changes"
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Password Reset / Change Form Component */}
      <PasswordChangeForm />

      {/* Account Details Card */}
      <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs">
        <h2 className="text-lg font-bold text-[#102124] mb-1">Account Credentials &amp; Status</h2>
        <p className="text-sm text-[#526267] mb-6">
          System metadata associated with your Soft Showcase account.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4]">
            <span className="text-xs font-medium text-[#526267] block mb-1">Account Role</span>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#155761]" />
              <span className="text-sm font-bold text-[#102124]">
                {user.isAdmin ? "Platform Administrator" : "Verified Customer"}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4]">
            <span className="text-xs font-medium text-[#526267] block mb-1">Member Since</span>
            <span className="text-sm font-bold text-[#102124]">{formattedDate}</span>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4]">
            <span className="text-xs font-medium text-[#526267] block mb-1">Auth Method</span>
            <span className="text-sm font-bold text-[#102124]">Password &amp; OAuth</span>
          </div>
        </div>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="bg-white rounded-2xl border border-rose-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-rose-800 mb-1 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-rose-600" />
              Delete Account
            </h2>
            <p className="text-sm text-[#526267] max-w-xl">
              Permanently delete your Soft Showcase account, active sessions, and profile data. Once deleted, this action cannot be undone.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDeleteConfirmEmail("");
              setDeleteReason("");
              setDeleteError(null);
              setShowDeleteModal(true);
            }}
            className="shrink-0 border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400 font-semibold gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete My Account
          </Button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#D9E2E4] max-w-md w-full p-6 space-y-4 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#102124]">Delete Your Account</h3>
                  <p className="text-xs text-[#526267]">This action is irreversible</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-[#F3F7F7] flex items-center justify-center cursor-pointer transition text-[#526267]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#526267] leading-relaxed">
              Your account, login sessions, and customer profile will be permanently deleted. You will be signed out immediately.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#102124] mb-1.5">
                  To confirm, type your email: <span className="font-mono text-rose-700 font-bold">{user.email}</span>
                </label>
                <Input
                  type="email"
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  placeholder="Type your email here"
                  className="text-xs border-[#D9E2E4] focus:ring-rose-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102124] mb-1.5">
                  Reason for leaving (optional)
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={2}
                  placeholder="Tell us why you are deleting your account…"
                  className="w-full text-xs rounded-xl border border-[#D9E2E4] px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#155761]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D9E2E4]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmEmail.trim().toLowerCase() !== user.email.toLowerCase()}
                className="text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5 disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {deleting ? "Deleting Account…" : "Permanently Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
