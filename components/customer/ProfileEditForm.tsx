// components/customer/ProfileEditForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Shield, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordChangeForm } from "./PasswordChangeForm";

interface ProfileEditFormProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    isAdmin: boolean;
    createdAt: Date;
  };
}

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState(user.name || "");
  const [whatsapp, setWhatsapp] = React.useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`customer_whatsapp_${user.id}`) || "";
    }
    return "";
  });
  const [contactEmail, setContactEmail] = React.useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(`customer_contact_email_${user.id}`) || user.email;
    }
    return user.email;
  });

  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

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
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      // Persist contact details for auto-filling inquiry & custom request forms
      if (typeof window !== "undefined") {
        localStorage.setItem(`customer_whatsapp_${user.id}`, whatsapp.trim());
        localStorage.setItem(`customer_contact_email_${user.id}`, contactEmail.trim());
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
    </div>
  );
}
