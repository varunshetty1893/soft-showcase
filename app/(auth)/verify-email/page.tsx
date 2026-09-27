// app/(auth)/verify-email/page.tsx
// Email verification page supporting 6-digit OTP and 1-click email links.

import type { Metadata } from "next";
import Link from "next/link";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Verify Email — Soft Showcase",
  description: "Verify your email address to activate your Soft Showcase account.",
  robots: { index: false },
};

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand / Logo */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-2xl font-black tracking-tight text-gray-950 hover:opacity-90 transition-opacity"
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600 text-white font-extrabold text-base shadow-md shadow-indigo-200">
              SS
            </span>
            <span>Soft Showcase</span>
          </Link>
          <h1 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
            Verify your email
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 sm:p-10">
          <Suspense
            fallback={
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            }
          >
            <VerifyEmailForm />
          </Suspense>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-xs text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-1 font-medium"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </main>
  );
}
