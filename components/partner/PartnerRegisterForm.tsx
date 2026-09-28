// components/partner/PartnerRegisterForm.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Phone,
  Briefcase,
  Globe,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

const STEPS = [
  { id: 1, title: "Account & Contact", shortTitle: "Account", icon: User },
  { id: 2, title: "Studio Profile", shortTitle: "Profile", icon: Briefcase },
  { id: 3, title: "Verification & Links", shortTitle: "Verification", icon: Globe },
];

export function PartnerRegisterForm() {
  const [currentStep, setCurrentStep] = useState(1);
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

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim() || formData.name.trim().length < 2) {
        errors.name = "Full name must be at least 2 characters";
      }
      if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
        errors.email = "Please provide a valid email address";
      }
      if (!formData.password || formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      } else if (!/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
        errors.password = "Password must contain at least one letter and one number";
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
      // Mobile / WhatsApp number is explicitly required
      if (!formData.whatsappNumber.trim()) {
        errors.whatsappNumber = "Mobile / WhatsApp number is required for direct buyer routing";
      } else if (formData.whatsappNumber.trim().replace(/\D/g, "").length < 7) {
        errors.whatsappNumber = "Please enter a valid mobile number with at least 7 digits";
      }
    } else if (step === 2) {
      if (!formData.displayName.trim() || formData.displayName.trim().length < 2) {
        errors.displayName = "Studio / display name must be at least 2 characters";
      }
      if (!formData.bio.trim() || formData.bio.trim().length < 10) {
        errors.bio = "Please provide a brief bio/background (at least 10 characters)";
      }
      if (!formData.skills.trim()) {
        errors.skills = "Core skills are required (e.g. Full-Stack, AI, React)";
      }
      if (!formData.technologies.trim()) {
        errors.technologies = "Primary technologies are required (e.g. Next.js, Python)";
      }
    } else if (step === 3) {
      // In step 3: except portfolio, all are required!
      if (!formData.githubUrl.trim()) {
        errors.githubUrl = "GitHub profile URL is required for code verification";
      } else if (!/^https?:\/\//i.test(formData.githubUrl.trim())) {
        errors.githubUrl = "Please enter a valid URL starting with http:// or https://";
      }

      if (!formData.linkedinUrl.trim()) {
        errors.linkedinUrl = "LinkedIn profile URL is required";
      } else if (!/^https?:\/\//i.test(formData.linkedinUrl.trim())) {
        errors.linkedinUrl = "Please enter a valid URL starting with http:// or https://";
      }

      if (formData.portfolioUrl.trim() && !/^https?:\/\//i.test(formData.portfolioUrl.trim())) {
        errors.portfolioUrl = "Portfolio URL must start with http:// or https://";
      }

      if (!formData.solutionsOffered.trim() || formData.solutionsOffered.trim().length < 2) {
        errors.solutionsOffered = "Please specify the types of solutions you build (e.g. Web Apps, Microservices)";
      }

      if (!formData.location.trim() || formData.location.trim().length < 2) {
        errors.location = "Location / region is required (e.g. Bengaluru, India or Remote)";
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setErrorBanner("Please review and complete the highlighted required fields before proceeding.");
      return false;
    }

    setErrorBanner(null);
    return true;
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
      window.scrollTo({ top: 120, behavior: "smooth" });
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    setFieldErrors({});

    // Validate all steps
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
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
          // If errors belong to an earlier step, navigate there
          if (data.details.name || data.details.email || data.details.password || data.details.whatsappNumber) {
            setCurrentStep(1);
          } else if (data.details.displayName || data.details.bio || data.details.skills || data.details.technologies) {
            setCurrentStep(2);
          } else {
            setCurrentStep(3);
          }
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
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* ── STEPPER PROGRESS BAR ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#D9E2E4] p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between relative">
          {/* Progress bar background line */}
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-[#E7EFF0] z-0" />
          {/* Progress fill */}
          <div
            className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-[#155761] transition-all duration-300 z-0"
            style={{
              width:
                currentStep === 1
                  ? "0%"
                  : currentStep === 2
                  ? "50%"
                  : "calc(100% - 48px)",
            }}
          />

          {STEPS.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id < currentStep) {
                    setErrorBanner(null);
                    setCurrentStep(step.id);
                  }
                }}
                disabled={step.id > currentStep}
                className={`relative z-10 flex flex-col items-center group ${
                  step.id <= currentStep ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border-2 ${
                    isCompleted
                      ? "bg-[#2F7D78] text-white border-[#2F7D78] shadow-xs"
                      : isCurrent
                      ? "bg-[#155761] text-white border-[#155761] ring-4 ring-[#155761]/15 shadow-sm"
                      : "bg-white text-[#8A9B9F] border-[#D9E2E4]"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={`text-xs font-bold transition-colors whitespace-nowrap ${
                      isCurrent
                        ? "text-[#155761]"
                        : isCompleted
                        ? "text-[#2F7D78]"
                        : "text-[#8A9B9F]"
                    }`}
                  >
                    <span className="hidden sm:inline">{step.title}</span>
                    <span className="sm:hidden">{step.shortTitle}</span>
                  </div>
                  <div className="text-[10px] text-[#526267] hidden md:block">
                    Step {step.id} of 3
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {errorBanner && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <span>{errorBanner}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── STEP 1: ACCOUNT CREDENTIALS & CONTACT ──────────────────────── */}
        {currentStep === 1 && (
          <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-[#D9E2E4] pb-4 flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F3F7F7] text-[#155761] text-[11px] font-bold uppercase tracking-wider mb-1">
                  <span>Step 1 of 3</span>
                </div>
                <h3 className="text-lg font-bold text-[#102124] flex items-center gap-2">
                  <User className="w-5 h-5 text-[#155761]" />
                  <span>Account Credentials &amp; Contact</span>
                </h3>
                <p className="text-xs text-[#526267] mt-0.5">
                  Set up your portal login credentials and primary direct contact line.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                  Full Legal / Personal Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Elena Vance"
                  className={fieldErrors.name ? "border-rose-400 focus:border-rose-500" : ""}
                  required
                />
                {fieldErrors.name && (
                  <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                  Account Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="developer@example.com"
                    className={`pl-9 ${fieldErrors.email ? "border-rose-400 focus:border-rose-500" : ""}`}
                    required
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters (letters + numbers)"
                    className={`pl-9 ${fieldErrors.password ? "border-rose-400 focus:border-rose-500" : ""}`}
                    required
                  />
                </div>
                {fieldErrors.password && (
                  <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className={`pl-9 ${fieldErrors.confirmPassword ? "border-rose-400 focus:border-rose-500" : ""}`}
                    required
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Mobile / WhatsApp Number (Required) */}
              <div className="sm:col-span-2 pt-1">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider">
                    WhatsApp / Mobile Number (Customer Inquiries) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    Required
                  </span>
                </div>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    placeholder="e.g. +91 98765 43210 or +1 415 555 2671"
                    className={`pl-9 ${fieldErrors.whatsappNumber ? "border-rose-400 focus:border-rose-500" : ""}`}
                    required
                  />
                </div>
                <p className="text-[11px] text-[#526267] mt-1.5 leading-relaxed">
                  Direct contact channel used by authenticated buyers on project pages to discuss custom requirements and technical demos.
                </p>
                {fieldErrors.whatsappNumber && (
                  <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {fieldErrors.whatsappNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-4 border-t border-[#D9E2E4] flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-[#526267]">
                Already have an account?{" "}
                <Link href="/login" className="text-[#155761] font-bold hover:underline">
                  Sign In
                </Link>
              </p>
              <Button
                type="button"
                onClick={handleNext}
                variant="primary"
                size="md"
                className="w-full sm:w-auto gap-2 px-6 font-bold shadow-xs cursor-pointer"
              >
                <span>Continue to Studio Profile</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: PROFESSIONAL & STUDIO PROFILE ─────────────────────── */}
        {currentStep === 2 && (
          <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-[#D9E2E4] pb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F3F7F7] text-[#155761] text-[11px] font-bold uppercase tracking-wider mb-1">
                <span>Step 2 of 3</span>
              </div>
              <h3 className="text-lg font-bold text-[#102124] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#155761]" />
                <span>Professional &amp; Studio Profile</span>
              </h3>
              <p className="text-xs text-[#526267] mt-0.5">
                Technical background and creator branding shown to platform reviewers and on your solutions.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                  Professional / Studio Display Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="e.g. Vance Software Studios or Varun Shetty"
                  className={fieldErrors.displayName ? "border-rose-400 focus:border-rose-500" : ""}
                  required
                />
                {fieldErrors.displayName && (
                  <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {fieldErrors.displayName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                  Professional Bio &amp; Engineering Focus <span className="text-rose-500">*</span>
                </label>
                <Textarea
                  name="bio"
                  rows={3}
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Describe your engineering focus, experience, and the kinds of software solutions you build..."
                  className={fieldErrors.bio ? "border-rose-400 focus:border-rose-500" : ""}
                  required
                />
                {fieldErrors.bio && (
                  <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {fieldErrors.bio}
                  </p>
                )}
              </div>

              {/* Perfectly Aligned Skills and Technologies Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1.5 h-5">
                    <label className="text-xs font-semibold text-[#102124] uppercase tracking-wider">
                      Core Skills <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-[#526267] font-medium">comma-separated</span>
                  </div>
                  <Input
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="Full-Stack, AI Agents, E-Commerce, UI/UX"
                    className={fieldErrors.skills ? "border-rose-400 focus:border-rose-500" : ""}
                    required
                  />
                  {fieldErrors.skills && (
                    <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fieldErrors.skills}
                    </p>
                  )}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-1.5 h-5">
                    <label className="text-xs font-semibold text-[#102124] uppercase tracking-wider">
                      Primary Technologies <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-[#526267] font-medium">comma-separated</span>
                  </div>
                  <Input
                    name="technologies"
                    value={formData.technologies}
                    onChange={handleChange}
                    placeholder="Next.js, TypeScript, Python, PostgreSQL"
                    className={fieldErrors.technologies ? "border-rose-400 focus:border-rose-500" : ""}
                    required
                  />
                  {fieldErrors.technologies && (
                    <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fieldErrors.technologies}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
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

            {/* Step 2 Actions */}
            <div className="pt-4 border-t border-[#D9E2E4] flex items-center justify-between gap-3">
              <Button
                type="button"
                onClick={handleBack}
                variant="outline"
                size="md"
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Account</span>
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                variant="primary"
                size="md"
                className="gap-2 px-6 font-bold shadow-xs cursor-pointer"
              >
                <span>Continue to Verification &amp; Links</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: VERIFICATION & CREATOR LINKS ──────────────────────── */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-[#D9E2E4] pb-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F3F7F7] text-[#155761] text-[11px] font-bold uppercase tracking-wider mb-1">
                <span>Step 3 of 3</span>
              </div>
              <h3 className="text-lg font-bold text-[#102124] flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#155761]" />
                <span>Verification &amp; Creator Links</span>
              </h3>
              <p className="text-xs text-[#526267] mt-0.5">
                Technical review links. Except portfolio website, all creator credentials are required for verification.
              </p>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Portfolio / Website (OPTIONAL) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider">
                      Portfolio / Website
                    </label>
                    <span className="text-[10px] text-[#526267] bg-[#F3F7F7] px-1.5 py-0.5 rounded">Optional</span>
                  </div>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      name="portfolioUrl"
                      value={formData.portfolioUrl}
                      onChange={handleChange}
                      placeholder="https://yourportfolio.dev"
                      className={`pl-9 text-xs ${fieldErrors.portfolioUrl ? "border-rose-400 focus:border-rose-500" : ""}`}
                    />
                  </div>
                  {fieldErrors.portfolioUrl && (
                    <p className="text-rose-600 text-xs mt-1.5">{fieldErrors.portfolioUrl}</p>
                  )}
                </div>

                {/* 2. GitHub Profile (REQUIRED) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider">
                      GitHub Profile <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-rose-600">Required</span>
                  </div>
                  <div className="relative">
                    <GithubIcon className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      name="githubUrl"
                      value={formData.githubUrl}
                      onChange={handleChange}
                      placeholder="https://github.com/username"
                      className={`pl-9 text-xs ${fieldErrors.githubUrl ? "border-rose-400 focus:border-rose-500" : ""}`}
                      required
                    />
                  </div>
                  {fieldErrors.githubUrl && (
                    <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.githubUrl}
                    </p>
                  )}
                </div>

                {/* 3. LinkedIn Profile (REQUIRED) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider">
                      LinkedIn Profile <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-rose-600">Required</span>
                  </div>
                  <div className="relative">
                    <LinkedinIcon className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      name="linkedinUrl"
                      value={formData.linkedinUrl}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/username"
                      className={`pl-9 text-xs ${fieldErrors.linkedinUrl ? "border-rose-400 focus:border-rose-500" : ""}`}
                      required
                    />
                  </div>
                  {fieldErrors.linkedinUrl && (
                    <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {fieldErrors.linkedinUrl}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                {/* 4. Solutions Offered (REQUIRED) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider">
                      Types of Solutions You Offer <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-rose-600">Required</span>
                  </div>
                  <Input
                    name="solutionsOffered"
                    value={formData.solutionsOffered}
                    onChange={handleChange}
                    placeholder="e.g. Web Apps, Microservices, Mobile Apps, SaaS"
                    className={fieldErrors.solutionsOffered ? "border-rose-400 focus:border-rose-500" : ""}
                    required
                  />
                  {fieldErrors.solutionsOffered && (
                    <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fieldErrors.solutionsOffered}
                    </p>
                  )}
                </div>

                {/* 5. Location / Region (REQUIRED) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider">
                      Location / Region <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] font-semibold text-rose-600">Required</span>
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <Input
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g. Bengaluru, India or Remote"
                      className={`pl-9 ${fieldErrors.location ? "border-rose-400 focus:border-rose-500" : ""}`}
                      required
                    />
                  </div>
                  {fieldErrors.location && (
                    <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {fieldErrors.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Reviewer Note */}
              <div className="p-4 rounded-2xl bg-[#F8FAFA] border border-[#D9E2E4] text-xs text-[#526267] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#102124]">
                  <ShieldCheck className="w-4 h-4 text-[#2F7D78]" />
                  <span>Curator Verification Policy</span>
                </div>
                <p>
                  Platform administrators verify that all partner code repositories adhere to software licensing, security standards, and direct maker ownership.
                </p>
              </div>
            </div>

            {/* Step 3 Actions */}
            <div className="pt-4 border-t border-[#D9E2E4] space-y-4">
              <p className="text-[11px] text-[#526267] leading-relaxed">
                By submitting this application, you agree to Soft Showcase&apos;s code quality standards, direct buyer communication policies, and acknowledge that approval is subject to administrative review.
              </p>

              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  size="md"
                  disabled={loading}
                  className="gap-1.5 text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Profile</span>
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  size="lg"
                  className="px-8 text-sm font-bold shadow-md cursor-pointer gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Solution Partner Application</span>
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
