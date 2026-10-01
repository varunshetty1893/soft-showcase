// app/privacy/page.tsx
// Public Privacy Policy page for Soft Showcase.
// Accurately discloses data flows (Google OAuth, inquiry routing, cookies, localStorage).
// Features prominent DRAFT banner per B7 requirements.

import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { APP_NAME } from "@/config/constants";
import { AlertTriangle, ChevronRight, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: `Privacy Policy (Draft) — ${APP_NAME}`,
  description:
    "Privacy Policy explaining how Soft Showcase collects, protects, and routes user data.",
};

export default function PrivacyPage() {
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
            <span className="text-[#102124] font-medium">Privacy Policy</span>
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
                This document is a technical and operational draft detailing the true data-handling architecture of Soft Showcase V1. Final compliance officer appointments, statutory contact details, and cross-border transfer statements require platform owner confirmation.
              </p>
            </div>
          </div>

          {/* Document Content */}
          <div className="bg-white rounded-3xl border border-[#D9E2E4] p-8 sm:p-12 shadow-xs space-y-8">
            <div className="border-b border-[#F3F7F7] pb-6 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F7F7] border border-[#D9E2E4] text-xs font-bold text-[#155761]">
                <Shield className="w-3.5 h-3.5" />
                <span>Data Protection Practices</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#102124] tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-xs text-[#526267]">
                Last updated: October 2026 • Version 1.0 (Draft)
              </p>
            </div>

            <div className="space-y-6 text-sm text-[#526267] leading-relaxed">
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">1. Information We Collect</h2>
                <p>
                  Soft Showcase collects information you provide directly, as well as data generated automatically during your session:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>Account Data:</strong> Name, email address, password hash (for credential signups), and avatar URL (if provided via Google sign-in).</li>
                  <li><strong>Inquiry Data:</strong> When submitting an inquiry on a project page, we collect your name, email address, optional phone/WhatsApp number, and message content.</li>
                  <li><strong>Custom Request Data:</strong> Project scope, budget preferences, technology requirements, and timeline details submitted via /custom-project.</li>
                  <li><strong>Technical Logs:</strong> IP address and user-agent string collected solely for rate limiting, bot prevention, and anti-abuse defense.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">2. How Your Information Is Used</h2>
                <p>
                  We process your data strictly to deliver platform services:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>Routing to Creators:</strong> Project inquiries are transmitted to the verified Solution Partner who created the listing so they can respond to you directly.</li>
                  <li><strong>Authentication &amp; Security:</strong> NextAuth session tokens authenticate your account and isolate your inquiry and ticket history.</li>
                  <li><strong>Transactional Notifications:</strong> Transactional emails (e.g. inquiry receipts, ticket updates, verification codes) sent via secure SMTP.</li>
                </ul>
                <p className="font-medium text-[#102124]">
                  We do not sell, rent, or monetize personal user data to third-party data brokers or marketing networks.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">3. Cookies &amp; Local Storage</h2>
                <p>
                  The Platform uses minimal cookies and browser storage strictly necessary for operation:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>Session Cookies:</strong> HTTP-only authentication and CSRF protection cookies managed by NextAuth.js.</li>
                  <li><strong>Local Storage:</strong> Browser storage used temporarily for guest project shortlists and UI display preferences.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">4. Third-Party Integrations</h2>
                <p>
                  We interact with trusted infrastructure providers to deliver the application:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>Authentication:</strong> Google OAuth (for one-click sign in).</li>
                  <li><strong>Database &amp; Hosting:</strong> PostgreSQL hosted securely on Neon with connection pooling; serverless hosting via Vercel.</li>
                  <li><strong>Rate Limiting &amp; Cache:</strong> Upstash Redis for distributed abuse prevention.</li>
                  <li><strong>Image Delivery:</strong> Cloudinary / image CDN for hosting project screenshots and thumbnails.</li>
                  <li><strong>Anti-Bot:</strong> Optional Cloudflare Turnstile token validation on public form submissions.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">5. Data Retention &amp; Rights</h2>
                <p>
                  You may request deletion of your account and personal inquiry records at any time by contacting our support team or opening a ticket in your customer dashboard.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">6. Contact &amp; Data Controller</h2>
                <p className="p-4 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] font-mono text-xs">
                  Data Controller: [DATA_CONTROLLER_PLACEHOLDER]<br />
                  Privacy Inquiries: [PRIVACY_CONTACT_EMAIL]<br />
                  Jurisdiction: [JURISDICTION_PLACEHOLDER]
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
