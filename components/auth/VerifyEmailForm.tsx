"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, AlertCircle, CheckCircle2, Mail, ArrowRight, RefreshCw } from "lucide-react";

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryEmail = searchParams.get("email") || "";
  const queryToken = searchParams.get("token") || "";

  const [email, setEmail] = useState(queryEmail);
  const [otp, setOtp] = useState(queryToken);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Auto-verify if both email and token are provided in the URL
  useEffect(() => {
    if (queryEmail && queryToken && queryToken.length === 6) {
      verifyCode(queryEmail, queryToken);
    }
  }, [queryEmail, queryToken]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  async function verifyCode(emailToVerify: string, codeToVerify: string) {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailToVerify.trim().toLowerCase(),
          otp: codeToVerify.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data?.error || "Invalid or expired verification code.");
        setLoading(false);
        return;
      }

      setSuccessMessage("Email verified successfully! Redirecting to sign in...");
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 1500);
    } catch {
      setErrorMessage("Network error verifying code. Please try again.");
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMessage("Please enter a valid 6-digit verification code.");
      return;
    }
    verifyCode(email, otp);
  }

  async function handleResend() {
    if (resendCooldown > 0 || resending) return;
    if (!email.trim()) {
      setErrorMessage("Please enter your email address to resend the code.");
      return;
    }

    setResending(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data?.error || "Failed to resend code.");
        setResending(false);
        return;
      }

      setResendCooldown(60);
      setSuccessMessage("A fresh 6-digit code has been sent to your email.");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch {
      setErrorMessage("Network error resending code. Please try again.");
    } finally {
      setResending(false);
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
          <Mail className="w-7 h-7" />
        </div>
        <p className="text-xs text-gray-500 max-w-xs mx-auto">
          We sent a 6-digit verification code to your email. Enter it below to activate your account.
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="font-semibold text-xs sm:text-sm">{successMessage}</p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="font-medium text-xs sm:text-sm">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Address */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm text-gray-900 placeholder-gray-400 bg-gray-50/50 hover:bg-white transition-colors"
          />
        </div>

        {/* 6-Digit OTP */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
            6-Digit Verification Code
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            required
            autoComplete="one-time-code"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-center font-mono font-bold text-2xl tracking-[0.4em] text-indigo-900 placeholder-gray-300 bg-gray-50/50 hover:bg-white transition-colors"
          />
          <p className="mt-1.5 text-[11px] text-gray-400 text-center">
            Verification code is valid for 15 minutes
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Verify & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Resend Code Section */}
      <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Didn&apos;t receive the code?</span>
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCooldown > 0 || resending}
          className="font-bold text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:cursor-not-allowed inline-flex items-center gap-1.5 transition-colors"
        >
          {resending && <RefreshCw className="w-3 h-3 animate-spin" />}
          <span>
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
          </span>
        </button>
      </div>

      <div className="mt-6 text-center text-xs text-gray-500">
        Already verified?{" "}
        <Link href="/login" className="font-bold text-indigo-600 hover:text-indigo-800 underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
