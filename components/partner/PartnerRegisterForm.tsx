// components/partner/PartnerRegisterForm.tsx
"use client";

import { useState, useEffect } from "react";
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
  Eye,
  EyeOff,
  RefreshCw,
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email verification state
  const [needsOtpVerification, setNeedsOtpVerification] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpSuccessMessage, setOtpSuccessMessage] = useState<string | null>(null);

  // Completed status
  const [submittedAndVerified, setSubmittedAndVerified] = useState(false);

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

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

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

  // Helper to normalize and check WhatsApp number (must be total 13 chars with country code)
  const formatAndValidateWhatsApp = (phone: string): { clean: string; isValid: boolean } => {
    let clean = phone.trim().replace(/[\s\-()]/g, "");
    if (/^\d{12}$/.test(clean)) {
      clean = `+${clean}`;
    }
    const isValid = /^\+[1-9]\d{11}$/.test(clean) && clean.length === 13;
    return { clean, isValid };
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim() || formData.name.trim().length < 2) {
        errors.name = "Full name must be at least 2 characters.";
      }
      if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        errors.email = "Please provide a valid email address.";
      }
      if (!formData.password || formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters long.";
      } else if (!/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
        errors.password = "Password must contain at least one letter and one number.";
      }
      if (!formData.confirmPassword) {
        errors.confirmPassword = "Please confirm your password.";
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
      }

      // WhatsApp number validation: total 13 characters with country code (e.g. +919876543210)
      const { isValid } = formatAndValidateWhatsApp(formData.whatsappNumber);
      if (!formData.whatsappNumber.trim()) {
        errors.whatsappNumber = "WhatsApp / Mobile number is required.";
      } else if (!isValid) {
        errors.whatsappNumber =
          "WhatsApp number must contain exactly 13 characters including country code (e.g. +919876543210).";
      }
    } else if (step === 2) {
      if (!formData.displayName.trim() || formData.displayName.trim().length < 2) {
        errors.displayName = "Studio / display name must be at least 2 characters.";
      }
      if (!formData.bio.trim() || formData.bio.trim().length < 10) {
        errors.bio = "Please provide a brief bio (at least 10 characters).";
      }
      if (!formData.skills.trim() || formData.skills.trim().length < 2) {
        errors.skills = "Core skills are required (e.g. Full-Stack, AI, React).";
      }
      if (!formData.technologies.trim() || formData.technologies.trim().length < 2) {
        errors.technologies = "Primary technologies are required (e.g. Next.js, Python).";
      }
    } else if (step === 3) {
      if (!formData.githubUrl.trim()) {
        errors.githubUrl = "GitHub profile URL is required.";
      } else if (!/^https?:\/\//i.test(formData.githubUrl.trim())) {
        errors.githubUrl = "Please enter a valid URL starting with http:// or https://";
      }

      if (!formData.linkedinUrl.trim()) {
        errors.linkedinUrl = "LinkedIn profile URL is required.";
      } else if (!/^https?:\/\//i.test(formData.linkedinUrl.trim())) {
        errors.linkedinUrl = "Please enter a valid URL starting with http:// or https://";
      }

      if (formData.portfolioUrl.trim() && !/^https?:\/\//i.test(formData.portfolioUrl.trim())) {
        errors.portfolioUrl = "Portfolio URL must start with http:// or https://";
      }

      if (!formData.solutionsOffered.trim() || formData.solutionsOffered.trim().length < 2) {
        errors.solutionsOffered = "Please specify the types of solutions you build (e.g. Web Apps, Microservices).";
      }

      if (!formData.location.trim() || formData.location.trim().length < 2) {
        errors.location = "Location / region is required (e.g. Bengaluru, India or Remote).";
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

    const { clean: cleanWhatsApp } = formatAndValidateWhatsApp(formData.whatsappNumber);

    const payload = {
      ...formData,
      whatsappNumber: cleanWhatsApp,
    };

    try {
      const res = await fetch("/api/partner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
          if (data.details.name || data.details.email || data.details.password || data.details.confirmPassword || data.details.whatsappNumber) {
            setCurrentStep(1);
          } else if (data.details.displayName || data.details.bio || data.details.skills || data.details.technologies) {
            setCurrentStep(2);
          } else {
            setCurrentStep(3);
          }
          setErrorBanner("Please review the highlighted fields below.");
        } else {
          setErrorBanner(data.error || "Failed to submit partner application. Please try again.");
        }
        return;
      }

      // If registration requires OTP verification
      if (data.requiresVerification) {
        setNeedsOtpVerification(true);
        setResendCooldown(60);
        window.scrollTo({ top: 100, behavior: "smooth" });
      } else {
        setSubmittedAndVerified(true);
      }
    } catch {
      setErrorBanner("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setOtpError("Please enter a valid 6-digit verification code.");
      return;
    }

    setOtpLoading(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          otp: otpCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data?.error || "Invalid or expired verification code.");
        setOtpLoading(false);
        return;
      }

      setNeedsOtpVerification(false);
      setSubmittedAndVerified(true);
      window.scrollTo({ top: 100, behavior: "smooth" });
    } catch {
      setOtpError("Network error verifying code. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Handle resending OTP code
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || resendingOtp) return;
    setResendingOtp(true);
    setOtpError(null);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setOtpError(data?.error || "Failed to resend code.");
        return;
      }

      setResendCooldown(60);
      setOtpSuccessMessage("A fresh 6-digit verification code has been sent to your email.");
      setTimeout(() => setOtpSuccessMessage(null), 6000);
    } catch {
      setOtpError("Network error resending verification code. Please try again.");
    } finally {
      setResendingOtp(false);
    }
  };

  // ── VIEW: EMAIL VERIFICATION (OTP / LINK) ────────────────────────────────
  if (needsOtpVerification) {
    return (
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-8 sm:p-10 shadow-sm text-center max-w-xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] flex items-center justify-center mx-auto shadow-xs">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-[#DDF4EC] text-[#2F7D78] text-xs font-bold uppercase tracking-wider">
            Email Verification Required
          </span>
          <h2 className="text-2xl font-bold text-[#102124]">
            Verify Your Email Address
          </h2>
          <p className="text-sm text-[#526267] leading-relaxed">
            We sent a 6-digit verification code and a 1-click confirmation link to:
          </p>
          <p className="text-sm font-bold text-[#155761] font-mono">
            {formData.email.trim().toLowerCase()}
          </p>
        </div>

        {otpSuccessMessage && (
          <div className="p-3.5 rounded-xl bg-[#DDF4EC] border border-[#2F7D78]/25 text-[#155761] text-xs flex items-start gap-2.5 text-left">
            <CheckCircle2 className="w-4 h-4 text-[#2F7D78] shrink-0 mt-0.5" />
            <span>{otpSuccessMessage}</span>
          </div>
        )}

        {otpError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 text-left">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{otpError}</span>
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-2">
              Enter 6-Digit Verification Code
            </label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="text-center font-mono font-bold text-2xl tracking-[0.4em] py-3 text-[#102124]"
              required
              autoFocus
            />
            <p className="text-[11px] text-[#526267] mt-1.5">
              Code is valid for 15 minutes. You can also click the link in the email.
            </p>
          </div>

          <Button
            type="submit"
            disabled={otpLoading || otpCode.length !== 6}
            variant="primary"
            size="lg"
            className="w-full font-bold shadow-xs cursor-pointer gap-2"
          >
            {otpLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <span>Verify &amp; Confirm Application</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <div className="pt-4 border-t border-[#D9E2E4] flex items-center justify-between text-xs text-[#526267]">
          <span>Didn&apos;t get the code?</span>
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={resendCooldown > 0 || resendingOtp}
            className="font-bold text-[#155761] hover:text-[#2F7D78] disabled:text-[#526267]/50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {resendingOtp && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend Code"}
            </span>
          </button>
        </div>
      </div>
    );
  }

  // ── VIEW: COMPLETED / VERIFIED ──────────────────────────────────────────
  if (submittedAndVerified) {
    return (
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-8 sm:p-10 shadow-sm text-center max-w-xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#DDF4EC] text-[#2F7D78] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-[#DDF4EC] text-[#2F7D78] text-xs font-bold uppercase tracking-wider">
            Email Verified • Application Received
          </span>
          <h2 className="text-2xl font-bold text-[#102124]">
            Solution Partner Application Under Review
          </h2>
          <p className="text-sm text-[#526267] leading-relaxed">
            Your email has been verified and your Solution Partner application is now officially queued for architectural review.
          </p>
        </div>

        <div className="p-4 bg-[#F8FAFA] rounded-2xl border border-[#D9E2E4] text-xs text-[#526267] text-left space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-[#102124]">
            <Sparkles className="w-3.5 h-3.5 text-[#155761]" />
            <span>Next steps for your application:</span>
          </div>
          <p>
            1. Our curation team evaluates your code repository, solution offerings, and portfolio.
          </p>
          <p>
            2. Review turnaround is typically 24–48 business hours.
          </p>
          <p>
            3. You can check your application status anytime using your registered email.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={`/partner/status?email=${encodeURIComponent(formData.email.trim().toLowerCase())}&verified=true`}
            className="w-full sm:w-auto"
          >
            <Button variant="primary" className="w-full font-bold">
              Check Application Status
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full">
              Partner Sign In
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
          <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-[#E7EFF0] z-0" />
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
              {/* Full Name */}
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
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.name}</span>
                  </p>
                )}
              </div>

              {/* Account Email */}
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
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.email}</span>
                  </p>
                )}
              </div>

              {/* Password with Eye Icon */}
              <div>
                <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters (letters + numbers)"
                    className={`pl-9 pr-10 ${fieldErrors.password ? "border-rose-400 focus:border-rose-500" : ""}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#526267] hover:text-[#102124] p-1 rounded transition-colors cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.password}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password with Eye Icon */}
              <div>
                <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className={`pl-9 pr-10 ${fieldErrors.confirmPassword ? "border-rose-400 focus:border-rose-500" : ""}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#526267] hover:text-[#102124] p-1 rounded transition-colors cursor-pointer"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.confirmPassword}</span>
                  </p>
                )}
              </div>

              {/* Mobile / WhatsApp Number (Required, with country code, total 13 chars) */}
              <div className="sm:col-span-2 pt-1">
                <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                  WhatsApp / Mobile Number (Customer Inquiries) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    name="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={handleChange}
                    placeholder="e.g. +919876543210 (country code + 10 digits, 13 chars total)"
                    className={`pl-9 ${fieldErrors.whatsappNumber ? "border-rose-400 focus:border-rose-500" : ""}`}
                    required
                  />
                </div>
                <p className="text-[11px] text-[#526267] mt-1.5 leading-relaxed">
                  Enter your international phone number with country code (e.g. +919876543210, exactly 13 characters total).
                </p>
                {fieldErrors.whatsappNumber && (
                  <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.whatsappNumber}</span>
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
              {/* Studio Display Name */}
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
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.displayName}</span>
                  </p>
                )}
              </div>

              {/* Bio */}
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
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{fieldErrors.bio}</span>
                  </p>
                )}
              </div>

              {/* Skills & Technologies Grid */}
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
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.skills}</span>
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
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.technologies}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Experience Summary */}
              <div>
                <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                  Experience Summary (Optional)
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
                {/* 1. Portfolio / Website (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                    Portfolio / Website (Optional)
                  </label>
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
                    <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.portfolioUrl}</span>
                    </p>
                  )}
                </div>

                {/* 2. GitHub Profile (Required) */}
                <div>
                  <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                    GitHub Profile <span className="text-rose-500">*</span>
                  </label>
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
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.githubUrl}</span>
                    </p>
                  )}
                </div>

                {/* 3. LinkedIn Profile (Required) */}
                <div>
                  <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                    LinkedIn Profile <span className="text-rose-500">*</span>
                  </label>
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
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.linkedinUrl}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
                {/* 4. Solutions Offered (Required) */}
                <div>
                  <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                    Types of Solutions You Offer <span className="text-rose-500">*</span>
                  </label>
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
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.solutionsOffered}</span>
                    </p>
                  )}
                </div>

                {/* 5. Location / Region (Required) */}
                <div>
                  <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5">
                    Location / Region <span className="text-rose-500">*</span>
                  </label>
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
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{fieldErrors.location}</span>
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
