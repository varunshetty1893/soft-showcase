// app/(auth)/verify-email/page.tsx
// Email verification page supporting 6-digit OTP and 1-click email links.

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
    <div className="relative min-h-screen flex flex-col bg-[#F8FAFA] antialiased selection:bg-[#DDF4EC] selection:text-[#102124]">
      {/* Background dot grid */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(#52626715_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Ambient subtle depth */}
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[280px] bg-[#155761]/4 rounded-full blur-[100px] z-0" />

      {/* Header */}
      <header className="relative z-10 w-full bg-white/80 backdrop-blur-xl border-b border-[#D9E2E4] shadow-xs">
        <div className="h-16 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center group py-1">
            <Image
              src="/logo.png"
              alt="Soft Showcase"
              width={130}
              height={27}
              className="h-7 w-auto object-contain"
              priority
            />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#526267] hover:text-[#155761] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to showcase
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex-1 flex items-center justify-center w-full px-6 py-10">
        <div className="w-full max-w-md mx-auto">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-[#D9E2E4] shadow-sm overflow-hidden p-7 sm:p-9">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="Soft Showcase"
                  width={150}
                  height={31}
                  className="h-8 w-auto object-contain"
                  priority
                />
              </Link>
            </div>

            <div className="text-center mb-6">
              <h1
                className="text-[24px] font-bold leading-[32px] tracking-[-0.02em] text-[#102124]"
                style={{ fontFamily: "var(--font-plus-jakarta, 'Plus Jakarta Sans', sans-serif)" }}
              >
                Verify your email
              </h1>
              <p className="mt-1.5 text-[13px] leading-5 text-[#526267] max-w-xs mx-auto">
                Enter your 6-digit confirmation code below to activate your Soft Showcase account.
              </p>
            </div>

            <Suspense
              fallback={
                <div className="py-12 flex justify-center">
                  <Loader2 className="w-6 h-6 border-2 border-[#155761] border-t-transparent rounded-full animate-spin" />
                </div>
              }
            >
              <VerifyEmailForm />
            </Suspense>
          </div>

          {/* Back link */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-xs text-[#526267] hover:text-[#155761] transition-colors inline-flex items-center gap-1 font-medium"
            >
              ← Back to Homepage
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full bg-white/70 backdrop-blur-md border-t border-[#D9E2E4] py-4">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#2F7D78]" />
            <span className="text-[12px] text-[#526267]">All systems operational</span>
          </div>
          <p suppressHydrationWarning className="text-[12px] text-[#526267]">© {new Date().getFullYear()} Soft Showcase. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-[12px] text-[#526267] hover:text-[#102124] transition-colors">Terms</Link>
            <Link href="/privacy" className="text-[12px] text-[#526267] hover:text-[#102124] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
