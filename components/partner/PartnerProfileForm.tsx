// components/partner/PartnerProfileForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

interface PartnerProfileFormProps {
  partner: any;
}

export function PartnerProfileForm({ partner }: PartnerProfileFormProps) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">

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
  );
}
