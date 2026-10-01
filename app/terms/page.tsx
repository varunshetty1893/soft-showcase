// app/terms/page.tsx
// Public Terms of Service page for Soft Showcase.
// Grounded strictly in actual application capabilities.
// Features prominent DRAFT banner per B7 requirements.

import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { APP_NAME } from "@/config/constants";
import { AlertTriangle, ChevronRight, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: `Terms of Service (Draft) — ${APP_NAME}`,
  description:
    "Terms of service governing use of the Soft Showcase software discovery and creator routing platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFA] text-[#102124]">
      <Navbar />

      <main className="flex-1 py-10 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-[#526267]">
            <Link href="/" className="hover:text-[#155761] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-[#526267]" />
            <span className="text-[#102124] font-medium">Terms of Service</span>
          </nav>

          {/* DRAFT Warning Banner */}
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 sm:p-6 shadow-xs flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wide">
                DRAFT — Pending Formal Legal Review
              </h2>
              <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                This document is a technical and operational draft reflecting the current capabilities of Soft Showcase V1. Final corporate entities, legal jurisdictions, and dispute arbitration clauses require confirmation from the platform owner.
              </p>
            </div>
          </div>

          {/* Document Content */}
          <div className="bg-white rounded-3xl border border-[#D9E2E4] p-8 sm:p-12 shadow-xs space-y-8">
            <div className="border-b border-[#F3F7F7] pb-6 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F7F7] border border-[#D9E2E4] text-xs font-bold text-[#155761]">
                <FileText className="w-3.5 h-3.5" />
                <span>Operational Agreement</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#102124] tracking-tight">
                Terms of Service
              </h1>
              <p className="text-xs text-[#526267]">
                Last updated: October 2026 • Version 1.0 (Draft)
              </p>
            </div>

            <div className="space-y-6 text-sm text-[#526267] leading-relaxed">
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">1. Platform Overview &amp; Role</h2>
                <p>
                  Soft Showcase (&quot;the Platform&quot;) operates solely as an interactive project discovery catalog and lead routing service. The Platform enables visitors to browse verified software architectures, review specifications, and connect directly with independent developers, creators, or digital studios (&quot;Solution Partners&quot; or &quot;Providers&quot;).
                </p>
                <p className="font-medium text-[#102124]">
                  Soft Showcase does NOT process customer payments, hold funds in escrow, or intermediate software delivery in V1. All commercial transactions, customizations, and code handovers are executed directly between you and the respective Solution Partner.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">2. User Accounts &amp; Authentication</h2>
                <p>
                  Users may browse public project listings without an account. To submit structured inquiries, access the customer portal, or save project shortlists, you may register using Google OAuth or email-based verification.
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>You are responsible for maintaining the security of your credentials and devices.</li>
                  <li>You agree to provide accurate and truthful contact information when submitting inquiries.</li>
                  <li>Soft Showcase reserves the right to suspend or terminate accounts that engage in spamming, abusive messaging, or security tampering.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">3. Direct Provider Inquiries &amp; WhatsApp Links</h2>
                <p>
                  When you submit an email inquiry or click a WhatsApp link:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Your submitted contact information (name, email, phone number, and message) is transmitted directly to the assigned Solution Partner.</li>
                  <li>The Solution Partner responds directly to your email address or initiates a WhatsApp conversation.</li>
                  <li>Soft Showcase does not inspect private WhatsApp communications and bears no responsibility for external chats.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">4. Custom Project Requests</h2>
                <p>
                  Users who submit custom software requests (/custom-project) grant the Platform administrator permission to evaluate their requirements and match them with appropriate Solution Partners. Submitting a request does not guarantee delivery, pricing quotes, or provider acceptance.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">5. Pricing Transparency &amp; Software Disclaimers</h2>
                <p>
                  Project listings state either Fixed Price, Starting Price, Free / Open-source, or Price on Request. Where an original price or comparison is displayed, it must reflect verifiable previous listings. Software solutions are owned and supplied directly by the Solution Partners. Soft Showcase does not warrant that listed code is error-free, uninterrupted, or suitable for any specific regulatory regime.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">6. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by applicable law, Soft Showcase and its operators shall not be liable for any indirect, incidental, or consequential damages resulting from transactions conducted between users and independent Solution Partners, or from any software deployed through external repositories.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">7. Operating Entity &amp; Governing Law</h2>
                <p className="p-4 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] font-mono text-xs">
                  Operating Entity: [OPERATING_ENTITY_PLACEHOLDER]<br />
                  Jurisdiction: [JURISDICTION_PLACEHOLDER]<br />
                  Official Contact: [CONTACT_EMAIL_PLACEHOLDER]
                </p>
                <p className="text-xs text-[#526267]">
                  These placeholders will be updated upon formal legal ratification.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
