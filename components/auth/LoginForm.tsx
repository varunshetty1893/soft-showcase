"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { getSafeCallbackUrl } from "@/lib/utils/safe-redirect";

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
    "w-full bg-white text-[#102124] text-sm pl-10 pr-3.5 py-2.5 rounded-xl",
    "shadow-xs placeholder:text-[#526267]/60",
    "focus:outline-none focus:bg-white transition-all",
    error
      ? "border border-rose-400 focus:ring-1 focus:ring-rose-500"
      : "border border-[#D9E2E4] focus:border-[#155761] focus:ring-1 focus:ring-[#155761]",
  ].join(" ");
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"), "/");
  const urlError = searchParams.get("error");
  const verifiedNotice = searchParams.get("verified");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Single active banner: either 'verified' or an error string
  const [activeBanner, setActiveBanner] = useState<{
    type: "verified" | "error";
    title?: string;
    message: string;
    unverifiedEmail?: string | null;
  } | null>(() => {
    if (verifiedNotice) {
      return {
        type: "verified",
        title: "Email verified successfully!",
        message: "You can now enter your password to sign in.",
      };
    }
    const urlCode = searchParams.get("code");
    if (
      urlCode === "TOO_MANY_ATTEMPTS" ||
      urlCode === "RATE_LIMIT_EXCEEDED" ||
      urlError === "TOO_MANY_ATTEMPTS" ||
      urlError === "RATE_LIMIT_EXCEEDED"
    ) {
      return {
        type: "error",
        title: "Too many login attempts",
        message: "Too many failed login attempts. For security reasons, please wait 15 minutes before trying again.",
      };
    }
    if (urlCode === "EMAIL_NOT_VERIFIED" || urlError === "EMAIL_NOT_VERIFIED") {
      return {
        type: "error",
        title: "Email unverified",
        message: "Please complete email verification before signing in.",
      };
    }
    if (urlError === "OAuthAccountNotLinked") {
      return {
        type: "error",
        title: "Account exists",
        message: "This email is registered with another login method.",
      };
    }
    if (urlError) {
      return {
        type: "error",
        title: "Authentication failed",
        message: "Sign in failed. Please check your credentials.",
      };
    }
    return null;
  });

  // Auto-dismiss verified notice after 8 seconds
  useEffect(() => {
    if (activeBanner?.type === "verified") {
      const timer = setTimeout(() => {
        setActiveBanner(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [activeBanner?.type]);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim() || !password) {
      setActiveBanner({
        type: "error",
        title: "Missing fields",
        message: "Please enter both your email and password.",
      });
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
        const isRateLimited =
          result.code === "TOO_MANY_ATTEMPTS" ||
          result.code === "RATE_LIMIT_EXCEEDED" ||
          result.error === "TOO_MANY_ATTEMPTS" ||
          result.error.includes("TOO_MANY_ATTEMPTS") ||
          result.error === "RATE_LIMIT_EXCEEDED" ||
          result.error.includes("RATE_LIMIT_EXCEEDED");

        const isUnverified =
          result.code === "EMAIL_NOT_VERIFIED" ||
          result.error === "EMAIL_NOT_VERIFIED" ||
          result.error.includes("EMAIL_NOT_VERIFIED");

        if (isRateLimited) {
          setActiveBanner({
            type: "error",
            title: "Too many login attempts",
            message: "Too many failed login attempts. For security reasons, please wait 15 minutes before trying again.",
          });
        } else if (isUnverified) {
          setActiveBanner({
            type: "error",
            title: "Email unverified",
            message: "Please complete email verification before signing in.",
            unverifiedEmail: email.trim().toLowerCase(),
          });
        } else {
          setActiveBanner({
            type: "error",
            title: "Invalid credentials",
            message: "The email or password you entered is incorrect. If you forgot your password, click 'Forgot password?' below.",
          });
        }
        setLoading(false);
        return;
      }

      // Successful sign in
      setActiveBanner(null);
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setActiveBanner({
        type: "error",
        title: "Sign in error",
        message: "An unexpected error occurred. Please try again.",
      });
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setActiveBanner(null);
    try {
      const res = (await signIn("google", { callbackUrl, redirect: true })) as { error?: string } | undefined;
      if (res?.error) {
        setActiveBanner({
          type: "error",
          title: "Google Sign-In unavailable",
          message: "Please sign in using your email and password.",
        });
        setGoogleLoading(false);
      }
    } catch (err: unknown) {
      console.warn("Google sign in notice:", err);
      setActiveBanner({
        type: "error",
        title: "Google Sign-In",
        message: "Please sign in with email and password or check Google OAuth credentials.",
      });
      setGoogleLoading(false);
    }
  }

  return (
    <div>
      {/* Mutually Exclusive Alert Banner (Auto-dismissable or manually dismissable) */}
      {activeBanner && (
        <div
          className={`mb-5 p-3.5 rounded-xl border flex items-start gap-3 transition-all duration-200 ${
            activeBanner.type === "verified"
              ? "bg-[#DDF4EC] border-[#2F7D78]/25 text-[#155761]"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          {activeBanner.type === "verified" ? (
            <CheckCircle2 className="w-5 h-5 text-[#2F7D78] shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 min-w-0">
            {activeBanner.title && (
              <p className="text-xs font-bold leading-tight">
                {activeBanner.title}
              </p>
            )}
            <p className="text-xs mt-0.5 opacity-90 leading-relaxed">
              {activeBanner.message}
            </p>

            {activeBanner.unverifiedEmail && (
              <Link
                href={`/verify-email?email=${encodeURIComponent(activeBanner.unverifiedEmail)}`}
                className="inline-block mt-2 text-xs font-bold text-rose-700 underline hover:text-rose-900"
              >
                Enter your 6-digit verification code →
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setActiveBanner(null)}
            className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white hover:bg-[#F3F7F7] text-[#102124] border border-[#D9E2E4] rounded-xl font-semibold text-sm transition-all shadow-xs hover:shadow-sm active:scale-[0.99] disabled:opacity-60 cursor-pointer"
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
          <label htmlFor="login-email" className="block text-xs font-semibold text-[#102124] mb-1.5 uppercase tracking-wider">
            Work or personal email
          </label>
          <div className="relative flex items-center">
            <svg className="absolute left-3.5 w-4 h-4 text-[#526267] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              id="login-email"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@example.com"
              required
              autoComplete="email"
              className={inputCls()}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="block text-xs font-semibold text-[#102124] uppercase tracking-wider">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-[#155761] hover:text-[#2F7D78] transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative flex items-center">
            <svg className="absolute left-3.5 w-4 h-4 text-[#526267] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
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
              className="absolute right-3 text-[#526267] hover:text-[#102124] p-1 rounded transition-colors cursor-pointer"
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
              "w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 cursor-pointer",
              rememberMe ? "bg-[#155761]" : "bg-white border border-[#D9E2E4]",
            ].join(" ")}
          >
            {rememberMe && (
              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <span
            onClick={() => setRememberMe(!rememberMe)}
            className="text-xs text-[#526267] select-none cursor-pointer"
          >
            Remember this device for 30 days
          </span>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#155761] hover:bg-[#10474F] text-white rounded-xl font-bold text-sm transition-all shadow-xs hover:shadow-sm active:scale-[0.99] disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In to Showcase</span>
                <span className="text-base leading-none">→</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Footer */}
      <div className="mt-6 pt-5 border-t border-[#D9E2E4] text-center space-y-2">
        <p className="text-xs text-[#526267]">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-bold text-[#155761] hover:text-[#2F7D78] transition-colors"
          >
            Create account
          </Link>
        </p>
        <p className="text-xs text-[#526267]">
          Software Creator or Agency?{" "}
          <Link
            href="/become-a-partner"
            className="font-bold text-[#2F7D78] hover:text-[#155761] transition-colors"
          >
            Become a Solution Partner →
          </Link>
        </p>
      </div>
    </div>
  );
}
