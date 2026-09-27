"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, Lock } from "lucide-react";

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

// Shared input classes — clean white background, neutral border, dark teal focus ring
function inputCls(error?: boolean) {
  return [
    "w-full bg-white text-[#102124] text-sm pl-10 pr-3.5 py-2.5 rounded-lg",
    "shadow-xs placeholder:text-[#526267]/60",
    "focus:outline-none focus:bg-white transition-all",
    error
      ? "border border-[#ba1a1a] focus:ring-1 focus:ring-[#ba1a1a]"
      : "border border-[#D9E2E4] focus:border-[#155761] focus:ring-1 focus:ring-[#155761]",
  ].join(" ");
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const urlError = searchParams.get("error");
  const verifiedNotice = searchParams.get("verified");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    urlError === "OAuthAccountNotLinked"
      ? "This email is linked with another login method."
      : urlError
      ? "Sign in failed. Please check your credentials."
      : null
  );
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setUnverifiedEmail(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes("EMAIL_NOT_VERIFIED")) {
          setUnverifiedEmail(email.trim().toLowerCase());
          setErrorMessage("Please verify your email address before signing in.");
        } else {
          setErrorMessage("Invalid email or password. Please try again.");
        }
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setErrorMessage("An unexpected error occurred. Please try again.");
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
      {/* Email verified notice */}
      {verifiedNotice && (
        <div className="mb-5 p-3 rounded-lg bg-[#DDF4EC] border border-[#2F7D78]/25 flex items-start gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-[#2F7D78] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#155761]">Email verified!</p>
            <p className="text-xs text-[#526267] mt-0.5">You can now sign in with your email and password.</p>
          </div>
        </div>
      )}

      {/* Access required notice when redirected from /projects */}
      {callbackUrl.includes("/projects") && !errorMessage && !verifiedNotice && (
        <div className="mb-5 p-3 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-start gap-2.5">
          <Lock className="w-5 h-5 text-[#155761] shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-[#102124]">Sign in required to view projects</p>
            <p className="text-xs text-[#526267] mt-0.5">Please sign in to browse software projects, view prices, and connect directly with providers.</p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {errorMessage && (
        <div className="mb-5 p-3 rounded-lg bg-[#ffdad6] border border-[#ba1a1a]/20 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-[#ba1a1a] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[12px] font-semibold text-[#93000a]">Authentication failed</p>
            <p className="text-[12px] text-[#93000a]/90 mt-0.5">{errorMessage}</p>
            {unverifiedEmail && (
              <Link
                href={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                className="inline-block mt-1 text-[12px] font-bold text-[#93000a] underline hover:opacity-80"
              >
                Enter your 6-digit verification code →
              </Link>
            )}
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

      {/* Google SSO */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || googleLoading}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-[#F3F7F7] text-[#102124] border border-[#D9E2E4] rounded-lg font-semibold text-sm transition-all shadow-xs hover:shadow-sm active:scale-[0.99] disabled:opacity-60 cursor-pointer"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#526267]" />
        ) : (
          <GoogleIcon />
        )}
        <span>Continue with Google</span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-6">
        <div className="w-full h-px bg-[#D9E2E4]" />
        <span className="absolute px-3 bg-white text-[12px] font-medium text-[#526267]">
          or continue with email
        </span>
      </div>

      {/* Credentials form */}
      <form onSubmit={handleCredentialsSubmit} className="space-y-4" id="sign-in-form">
        {/* Email */}
        <div>
          <label htmlFor="login-email" className="block text-[12px] font-semibold text-[#102124] mb-1.5 tracking-[0.02em]">
            Work or personal email
          </label>
          <div className="relative flex items-center">
            <svg className="absolute left-3.5 w-[18px] h-[18px] text-[#526267] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              id="login-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
              required
              autoComplete="email"
              className={inputCls()}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-[12px] font-semibold text-[#102124] tracking-[0.02em]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-semibold text-[#155761] hover:text-[#2F7D78] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative flex items-center">
            <svg className="absolute left-3.5 w-[18px] h-[18px] text-[#526267] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
              className={`${inputCls()} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-[#526267] hover:text-[#102124] p-1 rounded transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember device */}
        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            role="checkbox"
            aria-checked={rememberMe}
            onClick={() => setRememberMe(!rememberMe)}
            className={[
              "w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0",
              rememberMe ? "bg-[#155761]" : "bg-white border border-[#D9E2E4]",
            ].join(" ")}
          >
            {rememberMe && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <span className="text-[13px] text-[#526267]">Remember this device for 30 days</span>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            id="sign-in-submit"
            type="submit"
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-[#155761] hover:bg-[#10474F] text-white rounded-xl font-semibold text-sm shadow-xs hover:shadow hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <span>Sign In to Showcase</span>
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
