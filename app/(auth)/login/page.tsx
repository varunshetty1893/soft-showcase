// app/(auth)/login/page.tsx
// Sign-in page for Soft Showcase — Refined neutral palette with intentional brand accents.

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthBackground } from "@/components/auth/AuthBackground";
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
  let callbackUrl = params.callbackUrl || "/";

  // Prevent recursive redirect loops
  if (callbackUrl.startsWith("/login") || callbackUrl.startsWith("/api/auth")) {
    callbackUrl = "/";
  }

  if (session?.user) {
    const userEmail = ((session.user.email as string) || "").trim().toLowerCase();
    const configuredAdminEmail = (process.env.ADMIN_EMAIL || "shettymu25@gmail.com").trim().toLowerCase();
    const isEnvAdmin = Boolean(
      userEmail &&
      (userEmail === configuredAdminEmail ||
       userEmail === "shettymu25@gmail.com" ||
       userEmail === "shettybvarun@gmail.com")
    );
    const isAdmin = Boolean(session.user.isAdmin || session.user.role === "admin" || isEnvAdmin);

    if (callbackUrl.startsWith("/admin") && !isAdmin) {
      redirect("/?error=AdminAccessRequired");
    }

    redirect(callbackUrl);
  }

  return (
    <div className="relative min-h-screen flex flex-col antialiased selection:bg-[#DDF4EC] selection:text-[#102124]">
      {/* Animated Interactive Software Project Background */}
      <AuthBackground />

      {/* Header */}
      <header className="relative z-10 w-full bg-white/70 backdrop-blur-md border-b border-[#D9E2E4]/80 shadow-xs">
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
          {/* Auth Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-[#D9E2E4] shadow-xl overflow-hidden">
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
                  Welcome back
                </h1>
                <p className="mt-1.5 text-[13px] leading-5 text-[#526267] max-w-xs mx-auto">
                  Sign in to continue exploring software projects and manage your account.
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
                <LoginForm />
              </Suspense>
            </div>

            {/* Card Footer */}
            <div className="mt-7 px-7 sm:px-9 py-4 bg-[#F8FAFA] border-t border-[#D9E2E4] text-center">
              <p className="text-[13px] text-[#526267]">
                Don&apos;t have an account?{" "}
                <Link
                  href={callbackUrl && callbackUrl !== "/" ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/register"}
                  className="text-[#155761] font-semibold hover:text-[#2F7D78] transition-colors inline-flex items-center gap-0.5 ml-0.5"
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
            <div className="flex items-center gap-1.5 text-[12px] text-[#526267]">
              <svg className="w-4 h-4 text-[#155761]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>256-bit encrypted authentication</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-[#526267]">
              <svg className="w-4 h-4 text-[#155761]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Verified maker identity</span>
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
