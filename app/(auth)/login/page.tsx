// app/(auth)/login/page.tsx
// Sign-in page for Soft Showcase — Teal Mint Discovery design system.

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In — Soft Showcase",
  description:
    "Sign in to your Soft Showcase account to track inquiries, request custom software, and discover projects.",
  robots: { index: false },
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/";

  if (session?.user) redirect(callbackUrl);

  return (
    <div className="relative min-h-screen flex flex-col bg-[#eefcfe] antialiased selection:bg-[#8cf7ce] selection:text-[#002116]">

      {/* Background dot grid */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(#184e580d_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Ambient mint radial glow */}
      <div className="pointer-events-none fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#8cf7ce]/20 rounded-full blur-[120px] z-0" />

      {/* Header */}
      <header className="relative z-10 w-full bg-[#eefcfe]/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(24,78,88,0.04)]">
        <div className="h-16 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="Soft Showcase"
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-semibold text-[#40484a] hover:text-[#00373f] transition-colors"
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

          {/* Ambient halos behind card */}
          <div className="relative">
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#8cf7ce]/30 rounded-full blur-3xl pointer-events-none -z-10" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-[#b8ebf7]/40 rounded-full blur-3xl pointer-events-none -z-10" />

            {/* Auth Card */}
            <div className="bg-white rounded-2xl shadow-[0_4px_24px_-4px_rgba(24,78,88,0.08),0_1px_3px_rgba(24,78,88,0.04)] overflow-hidden">
              <div className="px-7 pt-8 pb-0 sm:px-9 sm:pt-10">

                {/* Logo */}
                <div className="flex justify-center mb-6">
                  <Link href="/">
                    <Image
                      src="/logo.png"
                      alt="Soft Showcase"
                      width={160}
                      height={44}
                      className="h-10 w-auto object-contain"
                      priority
                    />
                  </Link>
                </div>

                {/* Heading */}
                <div className="text-center mb-7">
                  <h1
                    className="text-[28px] font-bold leading-[36px] tracking-[-0.02em] text-[#111d1f]"
                    style={{ fontFamily: "var(--font-plus-jakarta, 'Plus Jakarta Sans', sans-serif)" }}
                  >
                    Welcome back
                  </h1>
                  <p className="mt-1.5 text-[13px] leading-5 text-[#40484a] max-w-xs mx-auto">
                    Sign in to continue exploring software projects and manage your account.
                  </p>
                </div>

                {/* Form */}
                <Suspense
                  fallback={
                    <div className="py-12 flex justify-center">
                      <div className="w-6 h-6 border-2 border-[#006c50] border-t-transparent rounded-full animate-spin" />
                    </div>
                  }
                >
                  <LoginForm />
                </Suspense>
              </div>

              {/* Card Footer */}
              <div className="mt-7 px-7 sm:px-9 py-4 bg-[#e9f6f8]/60 text-center">
                <p className="text-[13px] text-[#40484a]">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/register"
                    className="text-[#006c50] font-semibold hover:text-[#00373f] transition-colors inline-flex items-center gap-0.5 ml-0.5"
                  >
                    Create one
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                    </svg>
                  </Link>
                </p>
              </div>
            </div>

            {/* Trust badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4">
              <div className="flex items-center gap-1.5 text-[13px] text-[#40484a] opacity-80">
                <svg className="w-4 h-4 text-[#006c50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>256-bit encrypted authentication</span>
              </div>
              <div className="flex items-center gap-1.5 text-[13px] text-[#40484a] opacity-80">
                <svg className="w-4 h-4 text-[#006c50]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Verified maker identity</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full bg-[#eefcfe]/60 backdrop-blur-md shadow-[0_-1px_8px_rgba(24,78,88,0.02)] py-4">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#006c50] shadow-[0_0_8px_rgba(0,108,80,0.5)]" />
            <span className="text-[13px] text-[#40484a]">All systems operational</span>
          </div>
          <p className="text-[13px] text-[#40484a]">© 2025 Soft Showcase. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-[13px] text-[#40484a] hover:text-[#111d1f] transition-colors">Terms</Link>
            <Link href="/privacy" className="text-[13px] text-[#40484a] hover:text-[#111d1f] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
