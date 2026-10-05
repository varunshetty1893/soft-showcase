// app/terms/page.tsx
// Public Terms & Conditions (Terms of Service) page for Soft Showcase.
// Grounded strictly in the platform's actual capabilities and workflows.

import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { APP_NAME } from "@/config/constants";
import { ChevronRight, FileText, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: `Terms & Conditions — ${APP_NAME}`,
  description:
    "Terms and Conditions governing use of the Soft Showcase software discovery, creator routing, custom project request, and partner portal platform.",
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
            <span className="text-[#102124] font-medium">Terms &amp; Conditions</span>
          </nav>

          {/* Document Content */}
          <div className="bg-white rounded-3xl border border-[#D9E2E4] p-8 sm:p-12 shadow-xs space-y-8">
            <div className="border-b border-[#F3F7F7] pb-6 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3F7F7] border border-[#D9E2E4] text-xs font-bold text-[#155761]">
                <FileText className="w-3.5 h-3.5" />
                <span>Platform Terms &amp; Conditions</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#102124] tracking-tight">
                Terms &amp; Conditions
              </h1>
              <p className="text-xs text-[#526267]">
                Effective Date: October 2026 • Version 1.0
              </p>
            </div>

            <div className="space-y-6 text-sm text-[#526267] leading-relaxed">
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  1. Platform Overview &amp; Role
                </h2>
                <p>
                  Welcome to <strong>{APP_NAME}</strong> (&quot;the Platform&quot;). {APP_NAME} operates as a curated software project discovery catalog, Solution Partner portal, and direct lead-routing service. The Platform enables visitors and customers to explore deployable software applications, review technical specifications, features, and live demos, and connect directly with the independent software engineers, creators, and digital studios who built them (&quot;Solution Partners&quot; or &quot;Providers&quot;).
                </p>
                <p className="font-medium text-[#102124]">
                  {APP_NAME} is not an automated checkout gateway or escrow agent. All commercial negotiations, licensing agreements, payments, customizations, and source-code deliveries are conducted directly between the Customer and the respective Solution Partner.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  2. User Accounts, Roles &amp; Authentication
                </h2>
                <p>
                  Visitors may browse public project listings without registering. Creating an account via email verification (one-time passcode) or Google OAuth enables role-specific features across the Platform:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    <strong>Customers:</strong> May save projects to a personal shortlist, submit and track direct project inquiries (<Link href="/my-inquiries" className="text-[#155761] hover:underline">/my-inquiries</Link>), submit custom build requests (<Link href="/my-requests" className="text-[#155761] hover:underline">/my-requests</Link>), view verified payment receipts (<Link href="/my-transactions" className="text-[#155761] hover:underline">/my-transactions</Link>), and open support tickets (<Link href="/my-support" className="text-[#155761] hover:underline">/my-support</Link>).
                  </li>
                  <li>
                    <strong>Solution Partners:</strong> Independent developers and studios who register and receive administrator approval (<Link href="/become-a-partner" className="text-[#155761] hover:underline">/become-a-partner</Link>) may publish and manage software solutions, respond to customer inquiries, record installment and payment transactions, and request platform support.
                  </li>
                  <li>
                    <strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your credentials. Changing your password or using &quot;Sign Out Everywhere&quot; immediately invalidates active sessions across all devices.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  3. Solution Partner Listings, Ownership &amp; Moderation
                </h2>
                <p>
                  Solution Partners retain full ownership of and responsibility for the software projects they list on {APP_NAME}, including descriptions, screenshots, technical specifications, technology tags, FAQs, pricing, and deliverables (&quot;What&apos;s Included&quot;).
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    A project can be published publicly only when its assigned Solution Partner is active, approved, and has confirmed contact and listing consent.
                  </li>
                  <li>
                    For partner-owned solutions, content and pricing are managed by the Solution Partner. Platform administrators govern catalog moderation, including publication status, category placement, homepage featured placement, and change requests.
                  </li>
                  <li>
                    By listing a solution, the Solution Partner represents that they hold the necessary rights to showcase, license, or transfer the software described.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  4. Direct Provider Inquiries &amp; WhatsApp Routing
                </h2>
                <p>
                  {APP_NAME} facilitates direct communication between prospective buyers and Solution Partners through two primary channels:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    <strong>Email Inquiries:</strong> Submitting an inquiry on a project page records the inquiry in your account history and routes your name, email address, optional WhatsApp number, and message directly to the project&apos;s verified Solution Partner.
                  </li>
                  <li>
                    <strong>WhatsApp Direct Chat:</strong> Clicking &quot;Discuss on WhatsApp&quot; on a project page where WhatsApp contact is enabled generates a direct WhatsApp conversation link with the Solution Partner.
                  </li>
                  <li>
                    <strong>Anti-Spam &amp; Privacy Protection:</strong> Provider contact details are protected from public scraping, and all inquiry endpoints enforce automated bot verification and rate limiting.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  5. Custom Project Requests
                </h2>
                <p>
                  If you need a bespoke software solution or custom architecture not currently listed in the catalog, you may submit a request via <Link href="/custom-project" className="text-[#155761] hover:underline">/custom-project</Link> specifying your project title, category, preferred technology stack, required features, budget, and timeline. Submitting a custom project request allows our team to review your scope and coordinate next steps, and does not constitute a binding development contract until formally agreed by both parties.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  6. Pricing Transparency, Offers &amp; Transaction Receipts
                </h2>
                <p>
                  Each catalog listing clearly indicates its pricing model in Indian Rupees (INR / ₹):
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    <strong>Pricing Modes:</strong> Listings are designated as <em>Fixed Price</em>, <em>Starting From</em>, <em>Free</em>, or <em>Contact for Price</em>, along with optional qualifiers (such as One-Time, Customisation Extra, or Per License).
                  </li>
                  <li>
                    <strong>Honest Discounts &amp; Promotional Deals:</strong> Strikethrough original prices and discount percentages are displayed strictly when a verified regular price exceeds the active selling price during a valid deal window.
                  </li>
                  <li>
                    <strong>Transaction &amp; Installment Records:</strong> When a Customer and Solution Partner complete a purchase (either as a full payment or across multiple installments), the Solution Partner may log the payment details and UTR/reference numbers on the Platform. Once verified, downloadable and printable digital receipts are made available to the Customer under <Link href="/my-transactions" className="text-[#155761] hover:underline">/my-transactions</Link>.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  7. Saved Projects Shortlist
                </h2>
                <p>
                  The Shortlist feature (<Link href="/cart" className="text-[#155761] hover:underline">/cart</Link>) allows you to bookmark and compare software solutions of interest before reaching out to their creators. Saving a project to your Shortlist does not reserve inventory or initiate a purchase.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  8. Acceptable Use, Account Deletion &amp; Termination
                </h2>
                <p>
                  You agree not to misuse the Platform by submitting fraudulent inquiries, bypassing rate limits or security controls, scraping provider data, or uploading unlawful or infringing content.
                </p>
                <p>
                  You may permanently delete your Customer or Solution Partner account at any time from your profile settings. Upon account deletion, your login access, profile details, and active partner listings are removed, while historical transaction receipts and inquiry audit records are preserved in anonymized form for record-keeping integrity.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  9. Disclaimers &amp; Limitation of Liability
                </h2>
                <p>
                  All software solutions showcased on {APP_NAME} are developed and supplied by independent Solution Partners. The Platform provides catalog listings on an &quot;as-is&quot; and &quot;as-available&quot; basis without warranties of merchantability, fitness for a particular purpose, or regulatory compliance. To the maximum extent permitted by law, {APP_NAME} and its operators shall not be liable for any indirect, incidental, or consequential damages arising from third-party software deployments or direct commercial arrangements between Customers and Solution Partners.
                </p>
              </section>

              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  10. Governing Law &amp; Support Contact
                </h2>
                <p>
                  These Terms &amp; Conditions are governed by and construed in accordance with the laws of India. If you have questions regarding these Terms, a project listing, or a transaction record, please visit our <Link href="/support" className="text-[#155761] font-semibold hover:underline">Help Center</Link> or open a support ticket via your <Link href="/my-support" className="text-[#155761] font-semibold hover:underline">Support Dashboard</Link>.
                </p>
                <div className="p-4 rounded-2xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-between gap-4 text-xs text-[#102124]">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#155761] shrink-0" />
                    <span>
                      Need assistance with an inquiry, receipt, or partner listing?
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
