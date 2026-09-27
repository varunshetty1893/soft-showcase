// components/customer/ProfileEditForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Shield, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage({ type: "error", text: "Name cannot be empty." });
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

      setMessage({ type: "success", text: "Profile details updated successfully." });
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
    <div className="space-y-6">
      {/* Edit Basic Info Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950 mb-1">Personal Information</h2>
        <p className="text-sm text-gray-500 mb-6">
          Update your public name displayed when communicating with project providers.
        </p>

        {message && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-start gap-3 text-sm ${
              message.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <p>{message.text}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Display Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="email"
                value={user.email}
                disabled
                className="pl-10 text-sm bg-gray-50 text-gray-500 cursor-not-allowed border-gray-200"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Email is managed by your Google OAuth account and cannot be changed here.
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
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Account Details Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-bold text-gray-950 mb-1">Account Credentials & Status</h2>
        <p className="text-sm text-gray-500 mb-6">
          System metadata associated with your Soft Showcase account.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70">
            <span className="text-xs font-medium text-gray-500 block mb-1">Account Role</span>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-bold text-gray-900">
                {user.isAdmin ? "Platform Administrator" : "Verified Customer"}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70">
            <span className="text-xs font-medium text-gray-500 block mb-1">Member Since</span>
            <span className="text-sm font-bold text-gray-900">{formattedDate}</span>
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70">
            <span className="text-xs font-medium text-gray-500 block mb-1">Auth Provider</span>
            <span className="text-sm font-bold text-gray-900">Google OAuth 2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
