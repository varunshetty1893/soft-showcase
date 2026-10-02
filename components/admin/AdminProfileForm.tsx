// components/admin/AdminProfileForm.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface AdminProfileFormProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    isAdmin: boolean;
    createdAt: Date;
    hasPassword?: boolean;
  };
}

export function AdminProfileForm({ user }: AdminProfileFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const initialTab = searchParams.get("tab") === "password" ? "password" : "info";

  const [activeTab, setActiveTab] = React.useState<"info" | "password">(initialTab);

  // Profile info state
  const [name, setName] = React.useState(user.name || "");
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [profileMsg, setProfileMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [savingPassword, setSavingPassword] = React.useState(false);
  const [passwordMsg, setPasswordMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    if (!profileMsg) return;
    const timer = setTimeout(() => setProfileMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [profileMsg]);

  React.useEffect(() => {
    if (!passwordMsg) return;
    const timer = setTimeout(() => setPasswordMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [passwordMsg]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Display name cannot be empty.");
      return;
    }

    setSavingProfile(true);
    setProfileMsg(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      toast.success("Admin display name updated successfully.");
      router.refresh();
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(errText);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    setPasswordMsg(null);

    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password.");

      toast.success(
        "Password updated successfully! You can now log in with your email and this new password."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : "Failed to update password.";
      toast.error(errText);
    } finally {
      setSavingPassword(false);
    }
  };

  const formattedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Tabs */}
      <div className="flex border-b border-[#D9E2E4] gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("info")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === "info"
              ? "border-[#155761] text-[#155761]"
              : "border-transparent text-[#526267] hover:text-[#102124]"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("password")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === "password"
              ? "border-[#155761] text-[#155761]"
              : "border-transparent text-[#526267] hover:text-[#102124]"
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Change / Reset Password</span>
        </button>
      </div>

      {activeTab === "info" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs">
            <h2 className="text-base font-bold text-[#102124] mb-1">
              Admin Profile Information
            </h2>
            <p className="text-xs text-[#526267] mb-6">
              Update your administrator name shown on audit logs and communications.
            </p>

            {profileMsg && (
              <div
                className={`p-3.5 rounded-xl mb-6 flex items-start gap-2.5 text-xs ${
                  profileMsg.type === "success"
                    ? "bg-[#DDF4EC] border border-[#2F7D78]/25 text-[#155761]"
                    : "bg-rose-50 border border-rose-200 text-rose-800"
                }`}
              >
                {profileMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-[#2F7D78] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Administrator"
                    required
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="email"
                    value={user.email}
                    disabled
                    className="pl-9 text-sm bg-[#F8FAFA] text-[#526267] cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-[#526267] mt-1">
                  Primary administrator email defined in system environment configuration.
                </p>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" disabled={savingProfile} className="gap-2">
                  {savingProfile ? (
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

          {/* Account Metadata Card */}
          <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#526267] mb-3">
              Admin Status & Credentials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-[#F8FAFA] rounded-xl border border-[#D9E2E4]">
                <span className="text-[11px] text-[#526267] block mb-1">Access Level</span>
                <span className="inline-flex items-center gap-1 font-bold text-xs text-[#155761]">
                  <Shield className="w-3.5 h-3.5 text-[#2F7D78]" />
                  Super Administrator
                </span>
              </div>
              <div className="p-3 bg-[#F8FAFA] rounded-xl border border-[#D9E2E4]">
                <span className="text-[11px] text-[#526267] block mb-1">Account Created</span>
                <span className="font-semibold text-xs text-[#102124]">{formattedDate}</span>
              </div>
              <div className="p-3 bg-[#F8FAFA] rounded-xl border border-[#D9E2E4]">
                <span className="text-[11px] text-[#526267] block mb-1">Password Status</span>
                <span className="font-semibold text-xs text-emerald-700">
                  {user.hasPassword ? "Active Password Set" : "OAuth / Needs Password Setup"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "password" && (
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs">
          <h2 className="text-base font-bold text-[#102124] mb-1">
            Change / Reset Administrator Password
          </h2>
          <p className="text-xs text-[#526267] mb-6">
            Set or update your administrator password so you can sign in directly using email and password.
          </p>

          {passwordMsg && (
            <div
              className={`p-3.5 rounded-xl mb-6 flex items-start gap-2.5 text-xs ${
                passwordMsg.type === "success"
                  ? "bg-[#DDF4EC] border border-[#2F7D78]/25 text-[#155761]"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              {passwordMsg.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-[#2F7D78] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
            {user.hasPassword && (
              <div>
                <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                    className="pl-9 pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#526267] hover:text-[#102124]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters (letters & numbers)"
                  required
                  minLength={8}
                  className="pl-9 pr-10 text-sm"
                />
                {!user.hasPassword && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#526267] hover:text-[#102124]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  minLength={8}
                  className="pl-9 text-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" disabled={savingPassword} className="gap-2">
                {savingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
