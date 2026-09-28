// components/partner/PartnerRegisterForm.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Phone,
  Briefcase,
  FileText,
  Code,
  Globe,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function PartnerRegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    whatsappNumber: "",
    displayName: "",
    bio: "",
    skills: "",
    technologies: "",
    experience: "",
    portfolioUrl: "",
    githubUrl: "",
    linkedinUrl: "",
    solutionsOffered: "",
    expertiseAreas: "",
    location: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    setFieldErrors({});

    if (formData.password !== formData.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/partner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
          setErrorBanner("Please review the highlighted fields below.");
        } else {
          setErrorBanner(data.error || "Failed to submit partner application.");
        }
        return;
      }

      setSubmitted(true);
    } catch {
      setErrorBanner("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-8 sm:p-10 shadow-sm text-center max-w-xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#DDF4EC] text-[#2F7D78] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-[#102124]">
            Application Submitted Successfully
          </h2>
          <p className="text-sm text-[#526267] leading-relaxed">
            Your Solution Partner application has been received and is currently under review by the Soft Showcase administration team.
          </p>
        </div>

        <div className="p-4 bg-[#F8FAFA] rounded-2xl border border-[#D9E2E4] text-xs text-[#526267] text-left space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-[#102124]">
            <Sparkles className="w-3.5 h-3.5 text-[#155761]" />
            <span>What happens next?</span>
          </div>
          <p>
            1. Our curation team will review your software solutions, portfolio, and experience.
          </p>
          <p>
            2. You can sign in anytime at <Link href="/login" className="text-[#155761] underline font-semibold">/login</Link> to check your current application status.
          </p>
          <p>
            3. Once approved, your Partner Portal dashboard will automatically become active.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/partner/status" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full">
              View Application Status
            </Button>
          </Link>
          <Link href="/" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              Back to Showcase
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl mx-auto">
      {errorBanner && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* ── Section 1: Account Credentials ──────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-5">
        <div className="border-b border-[#D9E2E4] pb-3">
          <h3 className="text-base font-bold text-[#102124] flex items-center gap-2">
            <User className="w-4 h-4 text-[#155761]" />
            <span>1. Account Credentials</span>
          </h3>
          <p className="text-xs text-[#526267] mt-0.5">
            Basic credentials used to log into the Soft Showcase Partner Portal.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1">
              Full Legal / Personal Name *
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Elena Vance"
              required
            />
            {fieldErrors.name && (
              <p className="text-rose-600 text-xs mt-1">{fieldErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1">
              Account Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="developer@example.com"
                className="pl-9"
                required
              />
            </div>
            {fieldErrors.email && (
              <p className="text-rose-600 text-xs mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1">
              Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                className="pl-9"
                required
              />
            </div>
            {fieldErrors.password && (
              <p className="text-rose-600 text-xs mt-1">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                className="pl-9"
                required
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-rose-600 text-xs mt-1">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1">
              WhatsApp / Mobile Number (for customer contact)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                name="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={handleChange}
                placeholder="e.g. +91 98765 43210 or 919876543210"
                className="pl-9"
              />
            </div>
            <p className="text-[11px] text-[#526267] mt-1">
              Used when customers initiate direct WhatsApp enquiries regarding your software solutions.
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 2: Professional / Studio Information ───────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-5">
        <div className="border-b border-[#D9E2E4] pb-3">
          <h3 className="text-base font-bold text-[#102124] flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-[#155761]" />
            <span>2. Professional &amp; Studio Profile</span>
          </h3>
          <p className="text-xs text-[#526267] mt-0.5">
            Information shown to platform reviewers and public solution pages.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1">
              Professional / Studio Display Name *
            </label>
            <Input
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="e.g. Vance Software Studios or Varun Shetty"
              required
            />
            {fieldErrors.displayName && (
              <p className="text-rose-600 text-xs mt-1">
                {fieldErrors.displayName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1">
              Professional Bio &amp; Background *
            </label>
            <Textarea
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Describe your engineering focus, experience, and the kinds of software solutions you build..."
              required
            />
            {fieldErrors.bio && (
              <p className="text-rose-600 text-xs mt-1">{fieldErrors.bio}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1">
                Core Skills (comma-separated) *
              </label>
              <Input
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="Full-Stack, AI Agents, E-Commerce, UI/UX"
                required
              />
              {fieldErrors.skills && (
                <p className="text-rose-600 text-xs mt-1">{fieldErrors.skills}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1">
                Primary Technologies (comma-separated) *
              </label>
              <Input
                name="technologies"
                value={formData.technologies}
                onChange={handleChange}
                placeholder="Next.js, TypeScript, Python, PostgreSQL"
                required
              />
              {fieldErrors.technologies && (
                <p className="text-rose-600 text-xs mt-1">
                  {fieldErrors.technologies}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1">
              Experience Summary
            </label>
            <Input
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              placeholder="e.g. 5+ years building full-stack applications and production systems"
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: Portfolio & Online Presence ──────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-5">
        <div className="border-b border-[#D9E2E4] pb-3">
          <h3 className="text-base font-bold text-[#102124] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#155761]" />
            <span>3. Portfolio &amp; Professional Links (Optional)</span>
          </h3>
          <p className="text-xs text-[#526267] mt-0.5">
            Help reviewers assess the technical quality of your previous work.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1">
              Portfolio / Website URL
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                name="portfolioUrl"
                value={formData.portfolioUrl}
                onChange={handleChange}
                placeholder="https://yourportfolio.dev"
                className="pl-9 text-xs"
              />
            </div>
            {fieldErrors.portfolioUrl && (
              <p className="text-rose-600 text-xs mt-1">
                {fieldErrors.portfolioUrl}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1">
              GitHub Profile URL
            </label>
            <div className="relative">
              <GithubIcon className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleChange}
                placeholder="https://github.com/username"
                className="pl-9 text-xs"
              />
            </div>
            {fieldErrors.githubUrl && (
              <p className="text-rose-600 text-xs mt-1">
                {fieldErrors.githubUrl}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1">
              LinkedIn Profile URL
            </label>
            <div className="relative">
              <LinkedinIcon className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                name="linkedinUrl"
                value={formData.linkedinUrl}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/username"
                className="pl-9 text-xs"
              />
            </div>
            {fieldErrors.linkedinUrl && (
              <p className="text-rose-600 text-xs mt-1">
                {fieldErrors.linkedinUrl}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1">
              Types of Solutions You Offer
            </label>
            <Input
              name="solutionsOffered"
              value={formData.solutionsOffered}
              onChange={handleChange}
              placeholder="e.g. Web Apps, Microservices, Mobile Apps"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1">
              Location / Region
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Bengaluru, India or Remote"
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Submission Button & Terms ───────────────────────────────────── */}
      <div className="space-y-4">
        <p className="text-xs text-[#526267] leading-relaxed">
          By submitting this application, you agree to Soft Showcase&apos;s code quality standards, direct buyer communication policies, and acknowledge that approval is subject to administrative review.
        </p>

        <Button
          type="submit"
          disabled={loading}
          variant="primary"
          size="lg"
          className="w-full text-sm font-bold shadow-md cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Submitting Application...
            </>
          ) : (
            "Submit Solution Partner Application"
          )}
        </Button>

        <div className="text-center pt-2">
          <p className="text-xs text-[#526267]">
            Already an approved Solution Partner?{" "}
            <Link
              href="/login?callbackUrl=/partner/dashboard"
              className="text-[#155761] font-bold hover:underline"
            >
              Sign In to Partner Portal
            </Link>
          </p>
        </div>
      </div>
    </form>
  );
}
