"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { RegisterSchema } from "@/lib/validation/auth.schema";

// Google "G" SVG
function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  );
}

// Shared input classes
function inputCls(error?: boolean) {
  return [
    "w-full bg-[#f5fafa] text-[#111d1f] text-sm pl-10 pr-3.5 py-2.5 rounded-lg",
    "shadow-sm placeholder:text-[#70787b]/70 border",
    "focus:outline-none focus:bg-white transition-all",
    error
      ? "border-[#ba1a1a] focus:shadow-[0_0_0_2px_rgba(186,26,26,0.25)]"
      : "border-[#c0c8ca] focus:shadow-[0_0_0_2px_#184e58,0_0_12px_rgba(72,181,144,0.25)] focus:border-[#184e58]",
  ].join(" ");
}

// Password strength bar
function StrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password) || /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const filled = checks.filter(Boolean).length;
  const colors = ["#ba1a1a", "#e8a000", "#006c50", "#006c50"];
  const labels = ["Too short", "Weak", "Good", "Strong"];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: i < filled ? colors[filled - 1] : "#e3f0f3" }}
          />
        ))}
      </div>
      <p className="text-[11px]" style={{ color: filled > 0 ? colors[filled - 1] : "#70787b" }}>
        {filled > 0 ? labels[filled - 1] : ""}
      </p>
    </div>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    if (!agreedToTerms) {
      setErrorMessage("Please agree to the Terms of Service and Privacy Policy to continue.");
      return;
    }

    // Client-side Zod validation
    const validation = RegisterSchema.safeParse({ name, email, password, confirmPassword });

    if (!validation.success) {
      const errors: Record<string, string> = {};
      for (const err of validation.error.errors) {
        const fieldName = err.path[0]?.toString();
        if (fieldName && !errors[fieldName]) errors[fieldName] = err.message;
      }
      setFieldErrors(errors);
      setErrorMessage("Please correct the errors in the form.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data?.error || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // Redirect to OTP verification
      router.push(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch {
      setErrorMessage("Network error occurred. Please check your connection.");
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setErrorMessage(null);
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setErrorMessage("Failed to initiate Google sign in.");
      setGoogleLoading(false);
    }
  }

  return (
    <div>
      {/* Error banner */}
      {errorMessage && (
        <div className="mb-5 p-3 rounded-lg bg-[#ffdad6] border border-[#ba1a1a]/20 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-[#93000a]">Please fix the following</p>
            <p className="text-[12px] text-[#93000a]/90 mt-0.5">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-[#93000a]/50 hover:text-[#93000a] transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Google SSO — first */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || googleLoading}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-[#e9f6f8] hover:bg-[#ddebed] text-[#111d1f] rounded-lg font-semibold text-sm transition-all shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-60"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#40484a]" />
        ) : (
          <GoogleIcon />
        )}
        Sign up with Google
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-6">
        <div className="w-full h-px bg-[#ddebed]" />
        <span className="absolute px-3 bg-white text-[12px] font-medium text-[#70787b] uppercase tracking-[0.05em]">
          or register with email
        </span>
      </div>

      {/* Registration form */}
      <form onSubmit={handleSubmit} className="space-y-4" id="register-form">

        {/* Full Name */}
        <div>
          <label htmlFor="reg-name" className="block text-[12px] font-semibold text-[#111d1f] mb-1.5 tracking-[0.02em]">
            Full Name <span className="text-[#ba1a1a]">*</span>
          </label>
          <div className="relative flex items-center">
            <svg className="absolute left-3.5 w-[18px] h-[18px] text-[#70787b] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Morgan"
              required
              autoComplete="name"
              className={inputCls(!!fieldErrors.name)}
            />
          </div>
          {fieldErrors.name && (
            <p className="mt-1 text-[11px] text-[#ba1a1a] font-medium">{fieldErrors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="block text-[12px] font-semibold text-[#111d1f] mb-1.5 tracking-[0.02em]">
            Email address <span className="text-[#ba1a1a]">*</span>
          </label>
          <div className="relative flex items-center">
            <svg className="absolute left-3.5 w-[18px] h-[18px] text-[#70787b] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
              required
              autoComplete="email"
              className={inputCls(!!fieldErrors.email)}
            />
          </div>
          {fieldErrors.email && (
            <p className="mt-1 text-[11px] text-[#ba1a1a] font-medium">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="reg-password" className="block text-[12px] font-semibold text-[#111d1f] tracking-[0.02em]">
              Password <span className="text-[#ba1a1a]">*</span>
            </label>
            <span className="text-[11px] text-[#70787b]">Needs 8+ characters</span>
          </div>
          <div className="relative flex items-center">
            <svg className="absolute left-3.5 w-[18px] h-[18px] text-[#70787b] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter secure password"
              required
              autoComplete="new-password"
              className={`${inputCls(!!fieldErrors.password)} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-[#70787b] hover:text-[#111d1f] p-1 rounded transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <StrengthBar password={password} />
          {/* Requirement pills */}
          {!fieldErrors.password && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${password.length >= 8 ? "bg-[#8cf7ce]/40 text-[#006c50]" : "bg-[#e3f0f3] text-[#70787b]"}`}>
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  {password.length >= 8
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    : <circle cx="12" cy="12" r="9" strokeWidth={2} />
                  }
                </svg>
                8+ characters
              </span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${/[0-9]/.test(password) ? "bg-[#8cf7ce]/40 text-[#006c50]" : "bg-[#e3f0f3] text-[#70787b]"}`}>
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  {/[0-9]/.test(password)
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    : <circle cx="12" cy="12" r="9" strokeWidth={2} />
                  }
                </svg>
                1 number or symbol
              </span>
            </div>
          )}
          {fieldErrors.password && (
            <p className="mt-1 text-[11px] text-[#ba1a1a] font-medium">{fieldErrors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="reg-confirm" className="block text-[12px] font-semibold text-[#111d1f] mb-1.5 tracking-[0.02em]">
            Confirm password <span className="text-[#ba1a1a]">*</span>
          </label>
          <div className="relative flex items-center">
            <svg className="absolute left-3.5 w-[18px] h-[18px] text-[#70787b] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              id="reg-confirm"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              required
              autoComplete="new-password"
              className={`${inputCls(!!fieldErrors.confirmPassword)} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 text-[#70787b] hover:text-[#111d1f] p-1 rounded transition-colors"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-[11px] text-[#ba1a1a] font-medium">{fieldErrors.confirmPassword}</p>
          )}
        </div>

        {/* Terms checkbox */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <button
              type="button"
              role="checkbox"
              aria-checked={agreedToTerms}
              onClick={() => setAgreedToTerms(!agreedToTerms)}
              className={[
                "w-4 h-4 mt-0.5 rounded shrink-0 flex items-center justify-center transition-colors",
                agreedToTerms ? "bg-[#006c50]" : "bg-[#ddebed] border border-[#c0c8ca]",
              ].join(" ")}
            >
              {agreedToTerms && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className="text-[13px] text-[#40484a] leading-5">
              I agree to the{" "}
              <Link href="/terms" className="text-[#006c50] font-semibold hover:text-[#00373f] underline underline-offset-2 transition-colors">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#006c50] font-semibold hover:text-[#00373f] underline underline-offset-2 transition-colors">
                Privacy Policy
              </Link>
              , and consent to receive curated product updates.
            </span>
          </label>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            id="reg-submit"
            type="submit"
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-[#184e58] hover:bg-[#00373f] text-white rounded-xl font-semibold text-sm shadow-[0_4px_14px_rgba(24,78,88,0.22)] hover:shadow-[0_6px_20px_rgba(24,78,88,0.32)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating your account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
