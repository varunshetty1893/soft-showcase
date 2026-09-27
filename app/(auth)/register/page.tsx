// app/(auth)/register/page.tsx
// Registration page for Soft Showcase — Refined neutral palette with intentional brand accents.

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Create Account — Soft Showcase",
  description:
    "Create an account on Soft Showcase to track your software inquiries and submit custom software requests.",
  robots: { index: false },
};

interface RegisterPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/";

  if (session?.user) redirect(callbackUrl);

  return (
    <div className="relative min-h-screen flex flex-col bg-[#F8FAFA] antialiased selection:bg-[#DDF4EC] selection:text-[#102124]">

      {/* Background dot grid */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(#52626715_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Ambient subtle teal depth (extremely low opacity) */}
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
          <div className="bg-white rounded-2xl border border-[#D9E2E4] shadow-sm overflow-hidden">
            <div className="px-7 pt-8 pb-0 sm:px-9 sm:pt-10">

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

              {/* Heading */}
              <div className="text-center mb-7">
                <h1
                  className="text-[26px] font-bold leading-[34px] tracking-[-0.02em] text-[#102124]"
                  style={{ fontFamily: "var(--font-plus-jakarta, 'Plus Jakarta Sans', sans-serif)" }}
                >
                  Create your account
                </h1>
                <p className="mt-1.5 text-[13px] leading-5 text-[#526267] max-w-xs mx-auto">
                  Join Soft Showcase to discover projects, connect with developers, and request custom software.
                </p>
              </div>

              {/* Form */}
              <Suspense
                fallback={
                  <div className="py-12 flex justify-center">
                    <div className="w-6 h-6 border-2 border-[#155761] border-t-transparent rounded-full animate-spin" />
                  </div>
                }
              >
                <RegisterForm />
              </Suspense>
            </div>

            {/* Card footer */}
            <div className="mt-7 px-7 sm:px-9 py-4 bg-[#F8FAFA] border-t border-[#D9E2E4] text-center">
              <p className="text-[13px] text-[#526267]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-[#155761] font-semibold hover:text-[#2F7D78] transition-colors ml-0.5"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4">
            <div className="flex items-center gap-1.5 text-[12px] text-[#526267]">
              <svg className="w-4 h-4 text-[#155761]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Free maker &amp; buyer account</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-[#526267]">
              <svg className="w-4 h-4 text-[#155761]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Curated projects</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-[#526267]">
              <svg className="w-4 h-4 text-[#155761]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>Zero buyer commission</span>
            </div>
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
          <p className="text-[12px] text-[#526267]">© {new Date().getFullYear()} Soft Showcase. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-[12px] text-[#526267] hover:text-[#102124] transition-colors">Terms</Link>
            <Link href="/privacy" className="text-[12px] text-[#526267] hover:text-[#102124] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
