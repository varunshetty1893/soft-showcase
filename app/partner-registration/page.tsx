// app/partner-registration/page.tsx
// Dedicated separate public registration page for Solution Partners.
// Accessible directly without requiring prior sign in.

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles, ShieldCheck, CheckCircle2 } from "lucide-react";
import { PartnerRegisterForm } from "@/components/partner/PartnerRegisterForm";
import { Footer } from "@/components/layout/Footer";
import { APP_NAME, APP_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: `Solution Partner Registration — ${APP_NAME}`,
  description:
    "Register as a verified Soft Showcase Solution Partner. Showcase software solutions, handle customer enquiries directly, and manage transactions.",
  alternates: {
    canonical: `${APP_URL}/partner-registration`,
  },
};

export default function PartnerRegistrationPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFA] text-[#102124]">
      {/* Top Header */}
      <header className="w-full bg-white/90 backdrop-blur-xl border-b border-[#D9E2E4] sticky top-0 z-30">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center group py-1">
            <Image
              src="/logo.png"
              alt={APP_NAME}
              width={130}
              height={27}
              className="h-7 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/become-a-partner"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#526267] hover:text-[#155761] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Partner Ecosystem Overview</span>
              <span className="sm:hidden">Overview</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Header Banner */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#D9E2E4] text-xs font-semibold text-[#155761] shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#2F7D78]" />
              <span>Partner Onboarding Application</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#102124]">
              Solution Partner Registration
            </h1>
            <p className="text-sm text-[#526267] max-w-xl mx-auto leading-relaxed">
              Join as a verified software creator. Submit your profile and solution credentials below to begin showcasing your projects.
            </p>

            <div className="inline-flex flex-wrap items-center justify-center gap-3 text-xs text-[#526267] pt-1">
              <span className="flex items-center gap-1 text-[#2F7D78]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                No prior account needed
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-[#155761]">
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin reviewed &amp; verified
              </span>
              <span>•</span>
              <span>Direct customer communication</span>
            </div>
          </div>

          {/* Form */}
          <PartnerRegisterForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}
