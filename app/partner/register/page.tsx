// app/partner/register/page.tsx
// Solution Partner registration page.

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Sparkles } from "lucide-react";
import { PartnerRegisterForm } from "@/components/partner/PartnerRegisterForm";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Apply as Solution Partner — ${APP_NAME}`,
  description:
    "Register as a Soft Showcase Solution Partner to showcase software solutions, handle direct client enquiries, and record transactions.",
  robots: { index: false },
};

export default function PartnerRegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFA] text-[#102124]">
      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur-xl border-b border-[#D9E2E4] sticky top-0 z-20">
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
          <Link
            href="/become-a-partner"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#526267] hover:text-[#155761] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Partner Overview</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3F7F7] border border-[#D9E2E4] text-xs font-semibold text-[#155761]">
              <Sparkles className="w-3.5 h-3.5 text-[#2F7D78]" />
              <span>Partner Onboarding Application</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#102124]">
              Solution Partner Registration
            </h1>
            <p className="text-xs sm:text-sm text-[#526267] max-w-lg mx-auto leading-relaxed">
              Complete your profile below. All partner accounts are evaluated by platform curators prior to portal access.
            </p>
          </div>

          <PartnerRegisterForm />
        </div>
      </main>
    </div>
  );
}
