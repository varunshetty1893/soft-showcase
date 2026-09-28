// app/become-a-partner/page.tsx
// Public informational page for prospective Solution Partners.
// Explains onboarding requirements, vetting, verification, and portal features.

import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import {
  ShieldCheck,
  Code2,
  Users,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  Lock,
  Layers,
  Receipt,
  Headphones,
  CheckSquare,
  AlertCircle,
} from "lucide-react";
import { APP_NAME, APP_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: `Become a Solution Partner — ${APP_NAME}`,
  description:
    "Join Soft Showcase as a verified Solution Partner. Showcase software solutions, manage customer enquiries, record transactions, and grow your engineering client base.",
  alternates: {
    canonical: `${APP_URL}/become-a-partner`,
  },
};

export default function BecomeAPartnerPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFA] text-[#102124]">
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16">
          {/* ── 1. Hero ──────────────────────────────────────────────────── */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#D9E2E4] text-xs font-semibold text-[#155761] shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#2F7D78]" />
              <span>Partner Ecosystem</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#102124] leading-tight">
              Showcase Your Software Solutions as a{" "}
              <span className="text-[#155761]">Solution Partner</span>
            </h1>
            <p className="text-base sm:text-lg text-[#526267] leading-relaxed">
              Connect directly with verified buyers, businesses, and founders looking for production-ready applications, turnkey web platforms, and tailored software engineering.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link href="/partner-registration">
                <button className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-[#155761] hover:bg-[#10474F] text-white font-bold text-sm shadow-xs transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
                  <span>Apply to Become a Solution Partner</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/login?callbackUrl=/partner/dashboard">
                <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-[#F3F7F7] text-[#102124] border border-[#D9E2E4] font-semibold text-sm transition-all duration-150 cursor-pointer">
                  <span>Partner Sign In</span>
                </button>
              </Link>
            </div>
          </div>

          {/* ── 2. Notice: Review & Approval Required ────────────────────── */}
          <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-5 sm:p-6 text-amber-900 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 text-amber-800">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-sm">
              <h3 className="font-bold text-amber-950 text-base">
                Curated Partner Network: Manual Admin Approval Required
              </h3>
              <p className="text-amber-800/90 leading-relaxed text-xs sm:text-sm">
                Submitting a registration application does not automatically grant access to the Partner Portal. To ensure marketplace quality, every applicant undergoes architectural review by our platform administration. You will be notified once your application is evaluated.
              </p>
            </div>
          </div>

          {/* ── 3. Who Can Become a Solution Partner? ────────────────────── */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#102124]">
                Who Can Become a Solution Partner?
              </h2>
              <p className="text-sm text-[#526267] mt-1">
                We welcome builders, agencies, and teams with verifiable technical craftsmanship.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] flex items-center justify-center font-bold">
                  <Code2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#102124]">Independent Engineers</h3>
                <p className="text-xs sm:text-sm text-[#526267] leading-relaxed">
                  Full-stack developers, AI/ML specialists, and mobile app creators with battle-tested source code looking to monetize ready-to-deploy architectures.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] text-[#2F7D78] flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#102124]">Boutique Software Studios</h3>
                <p className="text-xs sm:text-sm text-[#526267] leading-relaxed">
                  Agile dev shops and design consultancies that have developed repeatable SaaS accelerators, storefronts, and internal automation utilities.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-[#102124]">Domain Specialists</h3>
                <p className="text-xs sm:text-sm text-[#526267] leading-relaxed">
                  Creators building vertical-specific software for commerce, healthcare, agriculture, logistics, and data analytics.
                </p>
              </div>
            </div>
          </div>

          {/* ── 4. What Solution Partners Can Do ─────────────────────────── */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#102124]">
                Capabilities Inside the Partner Portal
              </h2>
              <p className="text-sm text-[#526267] mt-1">
                A dedicated, isolated workspace engineered specifically for software creators.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-[#D9E2E4] shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#DDF4EC] text-[#2F7D78] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#102124]">Solution Management</h4>
                <p className="text-xs text-[#526267] leading-relaxed">
                  Publish, update, or draft software solutions with screenshots, tech stacks, live demos, and documentation.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#D9E2E4] shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#F3F7F7] text-[#155761] flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#102124]">Customer Enquiries</h4>
                <p className="text-xs text-[#526267] leading-relaxed">
                  Receive and respond directly to buyer enquiries, track negotiation stages, and schedule technical calls.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#D9E2E4] shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#DDF4EC] text-[#2F7D78] flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#102124]">Transaction Records</h4>
                <p className="text-xs text-[#526267] leading-relaxed">
                  Record solution purchases, customized orders, submit UTR/payment evidence, and track verification.
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#D9E2E4] shadow-xs space-y-2">
                <div className="w-8 h-8 rounded-lg bg-[#F3F7F7] text-[#155761] flex items-center justify-center">
                  <Headphones className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-sm text-[#102124]">Partner Support</h4>
                <p className="text-xs text-[#526267] leading-relaxed">
                  Dedicated ticketing system with platform administrators for onboarding questions, listings, and settlements.
                </p>
              </div>
            </div>
          </div>

          {/* ── 5. Partner Verification & Compliance ─────────────────────── */}
          <div className="bg-white rounded-3xl border border-[#D9E2E4] p-8 sm:p-10 shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#102124]">
                  Partner Verification &amp; Privacy Standards
                </h3>
                <p className="text-xs sm:text-sm text-[#526267]">
                  How identity and quality checks are handled with maximum privacy.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2F7D78] shrink-0 mt-0.5" />
                  <span className="text-[#526267]">
                    <strong className="text-[#102124]">Optional, Admin-Controlled Identity Verification:</strong>{" "}
                    Identity verification is not automatically mandated for every partner. If additional compliance is requested by administration, you can submit verified documents directly through your secure portal.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2F7D78] shrink-0 mt-0.5" />
                  <span className="text-[#526267]">
                    <strong className="text-[#102124]">Zero Public Exposure of Private Documents:</strong>{" "}
                    Verification records, private tax IDs, and confidential notes are never exposed publicly, never placed in public directories, and never shared with other partners or buyers.
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2F7D78] shrink-0 mt-0.5" />
                  <span className="text-[#526267]">
                    <strong className="text-[#102124]">Code Authenticity:</strong>{" "}
                    Partners certify that all listed solutions are original works, open-source derivatives with proper licenses, or proprietary software with distribution rights.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2F7D78] shrink-0 mt-0.5" />
                  <span className="text-[#526267]">
                    <strong className="text-[#102124]">Strict Data Isolation:</strong>{" "}
                    Every partner operates in an authenticated, isolated partition. No partner can view or edit another partner&apos;s solutions, transactions, or client correspondence.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 6. Step-by-Step Onboarding Process ───────────────────────── */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#102124]">
                How the Onboarding Process Works
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 shadow-xs relative">
                <span className="text-xs font-bold text-[#155761] uppercase tracking-wider block mb-2">Step 1</span>
                <h4 className="font-bold text-base text-[#102124] mb-1.5">Submit Application</h4>
                <p className="text-xs text-[#526267] leading-relaxed">
                  Fill out the partner registration form with your professional background, skills, and portfolio links.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 shadow-xs relative">
                <span className="text-xs font-bold text-[#155761] uppercase tracking-wider block mb-2">Step 2</span>
                <h4 className="font-bold text-base text-[#102124] mb-1.5">Administrative Review</h4>
                <p className="text-xs text-[#526267] leading-relaxed">
                  Our platform curators review your profile for technical credibility and alignment with marketplace standards.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 shadow-xs relative">
                <span className="text-xs font-bold text-[#2F7D78] uppercase tracking-wider block mb-2">Step 3</span>
                <h4 className="font-bold text-base text-[#102124] mb-1.5">Account Approval</h4>
                <p className="text-xs text-[#526267] leading-relaxed">
                  Upon approval, access to your dedicated Partner Dashboard is unlocked immediately.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 shadow-xs relative">
                <span className="text-xs font-bold text-[#2F7D78] uppercase tracking-wider block mb-2">Step 4</span>
                <h4 className="font-bold text-base text-[#102124] mb-1.5">Publish &amp; Transact</h4>
                <p className="text-xs text-[#526267] leading-relaxed">
                  Add software solutions, receive verified customer enquiries, and manage transaction records seamlessly.
                </p>
              </div>
            </div>
          </div>

          {/* ── 7. Final Application CTA ─────────────────────────────────── */}
          <div className="text-center bg-[#155761] text-white rounded-3xl p-8 sm:p-12 shadow-xl space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Ready to Join as a Solution Partner?
            </h2>
            <p className="text-white/80 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Showcase your code to business buyers and engineering leaders. Get started with your application today.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link href="/partner-registration">
                <button className="px-8 py-3.5 rounded-xl bg-white text-[#155761] font-bold text-sm shadow-md hover:bg-[#F3F7F7] transition-all cursor-pointer">
                  Apply to Become a Solution Partner
                </button>
              </Link>
              <Link href="/support">
                <button className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/15 transition-all cursor-pointer">
                  Have Questions? Contact Support
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
