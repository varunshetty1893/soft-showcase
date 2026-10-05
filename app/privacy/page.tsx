// app/privacy/page.tsx
// Public Privacy Policy page for Soft Showcase.
// Grounded strictly in the platform's actual capabilities, data models, and workflows,
// and aligned with the Terms & Conditions (/terms).

import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { APP_NAME } from "@/config/constants";
import { ChevronRight, Shield, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: `Privacy Policy — ${APP_NAME}`,
  description:
    "Privacy Policy explaining how Soft Showcase collects, protects, routes, and retains data across customer accounts, solution partner profiles, direct inquiries, custom requests, and verified transaction receipts.",
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

          {/* Document Content */}
          <div className="bg-white rounded-3xl border border-[#D9E2E4] p-8 sm:p-12 shadow-xs space-y-8">
            <div className="border-b border-[#F3F7F7] pb-6 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F7F7] border border-[#D9E2E4] text-xs font-bold text-[#155761]">
                <Shield className="w-3.5 h-3.5" />
                <span>Data Protection &amp; Privacy Practices</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#102124] tracking-tight">
                Privacy Policy
              </h1>
              <p className="text-xs text-[#526267]">
                Effective Date: October 2026 • Version 1.0
              </p>
            </div>

            <div className="space-y-6 text-sm text-[#526267] leading-relaxed">
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  1. Overview &amp; Scope
                </h2>
                <p>
                  This Privacy Policy explains how <strong>{APP_NAME}</strong> (&quot;the Platform&quot;) collects, uses, routes, and safeguards personal and technical information when you browse our software project catalog, register as a Customer or Solution Partner, submit direct creator inquiries, request custom builds, or access verified transaction receipts. This policy operates alongside our{" "}
                  <Link href="/terms" className="text-[#155761] font-semibold hover:underline">
                    Terms &amp; Conditions
                  </Link>
                  .
                </p>
                <p className="font-medium text-[#102124]">
                  {APP_NAME} is a software discovery and direct creator-routing platform. We do not sell, rent, trade, or monetize your personal data to third-party data brokers or advertising networks.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  2. Information We Collect
                </h2>
                <p>
                  Depending on your role and how you interact with {APP_NAME}, we collect the following categories of information:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    <strong>Customer Account &amp; Authentication Data:</strong> Full name, email address, bcrypt-hashed password (for email/password accounts), one-time passcode (OTP) verification records, Google OAuth profile identifier and avatar URL (when signing in with Google), role assignment, and session security version numbers.
                  </li>
                  <li>
                    <strong>Solution Partner Profile Data:</strong> When you register as a Solution Partner (<Link href="/become-a-partner" className="text-[#155761] hover:underline">/become-a-partner</Link>), we collect your public creator name, professional title, biography, years of experience, public contact email, optional WhatsApp number, website/GitHub/LinkedIn links, specialization categories, technology skills, and explicit contact and listing consent records.
                  </li>
                  <li>
                    <strong>Direct Project Inquiry Data:</strong> When you submit an inquiry on a project page, we collect your name, email address, optional phone/WhatsApp number, and message content so the listing&apos;s verified Solution Partner can respond to you directly.
                  </li>
                  <li>
                    <strong>Custom Project Request Data:</strong> Project title, category, preferred technology stack, budget range, target timeline, and functional requirements submitted via <Link href="/custom-project" className="text-[#155761] hover:underline">/custom-project</Link>.
                  </li>
                  <li>
                    <strong>Transaction &amp; Installment Receipt Records:</strong> When a Customer and Solution Partner complete a purchase (either in full or via installments), the Solution Partner may log the buyer&apos;s name, email, optional phone number, agreed amount, installment schedule, payment mode, and UTR/reference numbers to issue verified digital receipts under <Link href="/my-transactions" className="text-[#155761] hover:underline">/my-transactions</Link>. {APP_NAME} never collects or stores credit card numbers, banking passwords, or raw payment credentials.
                  </li>
                  <li>
                    <strong>Support Tickets &amp; Moderation Records:</strong> Support ticket subjects, messages, and status updates submitted via <Link href="/my-support" className="text-[#155761] hover:underline">/my-support</Link> or the Partner Support portal, as well as partner listing change requests and administrative audit logs.
                  </li>
                  <li>
                    <strong>Technical &amp; Anti-Abuse Telemetry:</strong> IP address, user-agent string, and anti-bot verification tokens collected strictly for rate limiting, abuse prevention, and security protection.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  3. How Your Information Is Used &amp; Routed
                </h2>
                <p>
                  We process personal data strictly to operate and secure the Platform:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    <strong>Direct Solution Partner Routing:</strong> Submitting a project inquiry records the inquiry in your <Link href="/my-inquiries" className="text-[#155761] hover:underline">/my-inquiries</Link> history and routes your contact details and message exclusively to the verified Solution Partner who owns that software solution.
                  </li>
                  <li>
                    <strong>WhatsApp Direct Chat:</strong> Clicking &quot;Discuss on WhatsApp&quot; on a project listing where the Solution Partner has enabled WhatsApp contact opens a direct WhatsApp chat link with that provider.
                  </li>
                  <li>
                    <strong>Provider Anti-Scraping Protection:</strong> Solution Partner contact details are governed by explicit consent flags and protected from unauthorized public scraping.
                  </li>
                  <li>
                    <strong>Role-Based Account Isolation:</strong> Session tokens enforce strict server-side access controls so only you can view your saved shortlist (<Link href="/cart" className="text-[#155761] hover:underline">/cart</Link>), inquiries (<Link href="/my-inquiries" className="text-[#155761] hover:underline">/my-inquiries</Link>), custom build requests (<Link href="/my-requests" className="text-[#155761] hover:underline">/my-requests</Link>), verified payment receipts (<Link href="/my-transactions" className="text-[#155761] hover:underline">/my-transactions</Link>), and support tickets (<Link href="/my-support" className="text-[#155761] hover:underline">/my-support</Link>).
                  </li>
                  <li>
                    <strong>Transactional Notifications:</strong> Sending email verification OTPs, password reset links, inquiry confirmations, partner status updates, and support ticket notifications via secure SMTP.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  4. Cookies, Session Security &amp; Local Storage
                </h2>
                <p>
                  {APP_NAME} uses only essential cookies and local browser storage required for core functionality and security:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    <strong>Session &amp; CSRF Cookies:</strong> HTTP-only authentication and cross-site request forgery (CSRF) protection cookies managed by NextAuth.js. We do not use third-party advertising or cross-site tracking cookies.
                  </li>
                  <li>
                    <strong>Session Revocation:</strong> Changing your password or selecting &quot;Sign Out Everywhere&quot; increments your account&apos;s security token version, immediately invalidating active sessions across all devices.
                  </li>
                  <li>
                    <strong>Browser Local Storage:</strong> Used on your device to store your Saved Projects Shortlist (<Link href="/cart" className="text-[#155761] hover:underline">/cart</Link>) and interface display preferences.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  5. Infrastructure &amp; Third-Party Service Providers
                </h2>
                <p>
                  We rely on vetted infrastructure partners to host and protect the Platform:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    <strong>Authentication:</strong> Google OAuth 2.0 (for optional one-click sign-in).
                  </li>
                  <li>
                    <strong>Database &amp; Hosting:</strong> Managed PostgreSQL database (Neon) with encrypted connections and serverless web hosting.
                  </li>
                  <li>
                    <strong>Rate Limiting &amp; Bot Protection:</strong> Upstash Redis for distributed rate limiting and optional Cloudflare Turnstile verification on public forms.
                  </li>
                  <li>
                    <strong>Media Delivery:</strong> Cloudinary and approved image CDNs for serving project screenshots, thumbnails, and profile avatars.
                  </li>
                  <li>
                    <strong>Transactional Email:</strong> Secure SMTP relay for account verification codes, password resets, and inquiry routing notifications.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  6. Data Retention, Account Deletion &amp; Anonymization
                </h2>
                <p>
                  You retain control over your account and personal information at all times:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    <strong>Profile &amp; Preference Management:</strong> You may update your name, contact details, password, or partner consent settings at any time from your <Link href="/profile" className="text-[#155761] hover:underline">Account Profile</Link> (<Link href="/partner/profile" className="text-[#155761] hover:underline">/partner/profile</Link> for Solution Partners).
                  </li>
                  <li>
                    <strong>Self-Service Account Deletion:</strong> You may permanently delete your Customer or Solution Partner account directly from your profile settings. Consistent with Section 8 of our <Link href="/terms" className="text-[#155761] hover:underline">Terms &amp; Conditions</Link>, deleting your account immediately removes your login access, personal profile details, and active partner listings, while historical transaction receipts and inquiry audit records are preserved in anonymized form for record-keeping integrity.
                  </li>
                  <li>
                    <strong>Ephemeral Verification Tokens:</strong> One-time registration passcodes and password-reset tokens are automatically purged upon use or expiration.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  7. Data Security Practices
                </h2>
                <p>
                  We implement defense-in-depth security measures across the Platform, including cryptographic password and OTP hashing, strict server-side ownership and role verification on all API endpoints, input validation and sanitization, anti-scraping guards for partner contact information, and automated rate limiting against brute-force and spam activity.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  8. Your Rights &amp; Privacy Contact
                </h2>
                <p>
                  In accordance with applicable data protection laws in India and international privacy standards, you have the right to access, correct, update, or delete your personal data, and to withdraw consent for public partner contact routing. For any privacy questions, data requests, or compliance inquiries regarding <strong>{APP_NAME}</strong>, please visit our{" "}
                  <Link href="/support" className="text-[#155761] font-semibold hover:underline">
                    Help Center
                  </Link>{" "}
                  or open a ticket via your{" "}
                  <Link href="/my-support" className="text-[#155761] font-semibold hover:underline">
                    Support Dashboard
                  </Link>
                  .
                </p>
                <div className="p-4 rounded-2xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-between gap-4 text-xs text-[#102124]">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#155761] shrink-0" />
                    <span>
                      Questions about your data privacy, account deletion, or our{" "}
                      <Link href="/terms" className="font-semibold text-[#155761] hover:underline">
                        Terms &amp; Conditions
                      </Link>
                      ?
                    </span>
                  </div>
                  <Link
                    href="/support"
                    className="font-bold text-[#155761] hover:underline shrink-0"
                  >
                    Contact Support →
                  </Link>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

