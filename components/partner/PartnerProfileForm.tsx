// components/partner/PartnerProfileForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, Trash2, AlertTriangle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

interface PartnerProfileFormProps {
  partner: any;
  userEmail?: string;
}

export function PartnerProfileForm({ partner, userEmail }: PartnerProfileFormProps) {
  const router = useRouter();
  const toast = useToast();

  const [displayName, setDisplayName] = React.useState(partner?.displayName || "");
  const [bio, setBio] = React.useState(partner?.bio || "");
  const [whatsappNumber, setWhatsappNumber] = React.useState(partner?.whatsappNumber || "");
  const [avatarUrl, setAvatarUrl] = React.useState(partner?.avatarUrl || "");
  const [skills, setSkills] = React.useState(
    Array.isArray(partner?.skills) ? partner.skills.join(", ") : partner?.skills || ""
  );
  const [technologies, setTechnologies] = React.useState(
    Array.isArray(partner?.technologies) ? partner.technologies.join(", ") : partner?.technologies || ""
  );
  const [experience, setExperience] = React.useState(partner?.experience || "");
  const [portfolioUrl, setPortfolioUrl] = React.useState(partner?.portfolioUrl || "");
  const [githubUrl, setGithubUrl] = React.useState(partner?.githubUrl || "");
  const [linkedinUrl, setLinkedinUrl] = React.useState(partner?.linkedinUrl || "");
  const [location, setLocation] = React.useState(partner?.location || "");
  const [showEmail, setShowEmail] = React.useState(partner?.showEmail ?? true);
  const [showWhatsapp, setShowWhatsapp] = React.useState(partner?.showWhatsapp ?? true);

  const [loading, setLoading] = React.useState(false);

  // Account deletion state
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = React.useState("");
  const [deleteReason, setDeleteReason] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/partner/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          bio: bio.trim(),
          whatsappNumber: whatsappNumber.trim() || null,
          avatarUrl: avatarUrl.trim() || null,
          skills,
          technologies,
          experience: experience.trim() || null,
          portfolioUrl: portfolioUrl.trim() || null,
          githubUrl: githubUrl.trim() || null,
          linkedinUrl: linkedinUrl.trim() || null,
          location: location.trim() || null,
          showEmail,
          showWhatsapp,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      toast.success("Partner studio profile updated successfully!");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userEmail) return;
    if (deleteConfirmEmail.trim().toLowerCase() !== userEmail.toLowerCase()) {
      toast.error("Email does not match. Please enter your exact registered email address.");
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmEmail: deleteConfirmEmail.trim(),
          reason: deleteReason.trim() || "Partner self-deletion from studio settings",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete account");
      toast.success("Account permanently deleted. Redirecting…");
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-6">

      {/* Identity & Studio info */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          Studio Profile &amp; Identity
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-[#102124]">Studio / Display Name *</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-[#102124]">Location / Timezone</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Bangalore, India (IST)"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-[#102124]">Avatar / Logo URL</Label>
          <Input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://..."
            className="mt-1 text-xs"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold text-[#102124]">Professional Bio *</Label>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            required
            className="mt-1 text-xs"
          />
        </div>
      </div>

      {/* Contact & WhatsApp */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          Direct Contact &amp; Channels
        </h2>

        <div>
          <Label className="text-xs font-semibold text-[#102124]">WhatsApp Mobile Number</Label>
          <Input
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="919876543210"
            className="mt-1 font-mono text-xs"
          />
          <p className="text-[11px] text-[#526267] mt-1">
            Country code followed by digits without spaces (e.g. 14155552671).
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <label className="flex items-center gap-2 text-xs text-[#102124] cursor-pointer">
            <input
              type="checkbox"
              checked={showEmail}
              onChange={(e) => setShowEmail(e.target.checked)}
              className="w-4 h-4 rounded text-[#155761]"
            />
            <span>Show email address publicly to prospective buyers</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-[#102124] cursor-pointer">
            <input
              type="checkbox"
              checked={showWhatsapp}
              onChange={(e) => setShowWhatsapp(e.target.checked)}
              className="w-4 h-4 rounded text-[#155761]"
            />
            <span>Show &quot;Discuss on WhatsApp&quot; button on solution pages</span>
          </label>
        </div>
      </div>

      {/* Skills & Technologies */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          Expertise &amp; Tech Stack
        </h2>

        <div>
          <Label className="text-xs font-semibold text-[#102124]">Skills (Comma-separated)</Label>
          <Input
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Full-Stack Web, AI Integration, E-Commerce Development"
            className="mt-1 text-xs"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold text-[#102124]">Technologies (Comma-separated)</Label>
          <Input
            value={technologies}
            onChange={(e) => setTechnologies(e.target.value)}
            placeholder="Next.js, TypeScript, Python, Flask, PostgreSQL, MySQL"
            className="mt-1 text-xs"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold text-[#102124]">Years of Experience &amp; Specialization</Label>
          <Input
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="6+ years building scalable SaaS applications and custom APIs"
            className="mt-1 text-xs"
          />
        </div>
      </div>

      {/* Portfolio Links */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          Portfolio &amp; External Links
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-semibold text-[#102124]">Portfolio Website</Label>
            <Input
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 text-xs"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-[#102124]">GitHub Profile</Label>
            <Input
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/..."
              className="mt-1 text-xs"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-[#102124]">LinkedIn Profile</Label>
            <Input
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="mt-1 text-xs"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={loading}
          className="font-bold shadow-md gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Save Studio Settings</span>
        </Button>
      </div>
    </form>

      {/* ── Danger Zone ─────────────────────────────────────────────── */}
      {userEmail && (
        <div className="bg-white rounded-3xl border-2 border-rose-200 p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <h2 className="text-base font-bold text-rose-700">Danger Zone</h2>
          </div>
          <p className="text-xs text-rose-600/80 mb-4">
            Permanently delete your partner account and all associated data. This action is irreversible.
            Your published solutions will be unpublished, and your partner portal access will be revoked.
          </p>
          <button
            type="button"
            onClick={() => {
              setShowDeleteModal(true);
              setDeleteConfirmEmail("");
              setDeleteReason("");
            }}
            className="inline-flex items-center gap-2 h-9 px-4 text-xs font-bold rounded-xl border-2 border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 hover:border-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete My Partner Account
          </button>
        </div>
      )}

      {/* ── Delete Account Modal ─────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#102124]">Delete Partner Account</h3>
                  <p className="text-[11px] text-rose-600 font-medium">This cannot be undone</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-[#F3F7F7] flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4 text-[#526267]" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 space-y-1 text-[11px] text-rose-800">
              <p className="font-semibold">What will be deleted:</p>
              <ul className="list-disc list-inside space-y-0.5 opacity-90">
                <li>Your partner account and login access</li>
                <li>Your partner profile and studio settings</li>
                <li>All published and draft solutions</li>
                <li>Support tickets you raised</li>
              </ul>
              <p className="font-semibold mt-2">What will be preserved (anonymised):</p>
              <ul className="list-disc list-inside space-y-0.5 opacity-90">
                <li>Transaction records (customer receipts)</li>
                <li>Inquiry history (audit trail)</li>
              </ul>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[#102124]">
                  Type your email{" "}
                  <span className="font-mono text-rose-700">{userEmail}</span>{" "}
                  to confirm
                </label>
                <input
                  type="email"
                  value={deleteConfirmEmail}
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                  placeholder={userEmail}
                  autoComplete="off"
                  className="mt-1 w-full text-xs rounded-xl border border-[#D9E2E4] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#102124]">Reason (optional)</label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  rows={2}
                  placeholder="Tell us why you are leaving (optional)…"
                  className="mt-1 w-full text-xs rounded-xl border border-[#D9E2E4] px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="h-9 px-4 text-xs font-semibold rounded-xl border border-[#D9E2E4] text-[#526267] hover:bg-[#F3F7F7] transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={
                  deleting ||
                  deleteConfirmEmail.trim().toLowerCase() !== (userEmail || "").toLowerCase()
                }
                className="h-9 px-4 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1.5 shadow-sm"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Permanently Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
