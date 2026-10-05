// app/terms/page.tsx
// Public Terms & Conditions (Terms of Service) page for Soft Showcase.
// Grounded strictly in the platform's actual schema, APIs, authentication, and workflows.

import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { APP_NAME } from "@/config/constants";
import { ChevronRight, FileText, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: `Terms & Conditions — ${APP_NAME}`,
  description:
    "Terms and Conditions governing use of the Soft Showcase software discovery catalog, Solution Partner portal, direct inquiry routing, custom project requests, and transaction record management platform.",
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
              {/* 1. Platform Role */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  1. Platform Role &amp; Business Model
                </h2>
                <p>
                  Welcome to <strong>{APP_NAME}</strong> (&quot;the Platform&quot;). {APP_NAME} provides an online platform for software discovery, project cataloguing, customer enquiries, direct communication with Solution Partners, custom project requests, partner project management, transaction record management, and digital receipts where applicable.
                </p>
                <p>
                  The Platform enables visitors and registered Customers to browse published software listings, review technical specifications, features, FAQs, pricing models, and live demonstrations, and connect with independent software developers, engineers, and digital studios (&quot;Solution Partners&quot; or &quot;Providers&quot;).
                </p>
                <p className="font-medium text-[#102124]">
                  {APP_NAME} is not a bank, financial institution, escrow service, or automated payment gateway, and {APP_NAME} is not automatically the seller of listed software projects or a guarantor of partner performance. Unless {APP_NAME} expressly agrees in writing to become a direct party to a specific engagement, all commercial negotiations, pricing agreements, project delivery, customization, source-code handover, licensing, and payments take place directly between the Customer and the relevant Solution Partner.
                </p>
              </section>

              {/* 2. Customer Accounts */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  2. Customer Accounts &amp; Authentication
                </h2>
                <p>
                  Visitors may browse public project listings without registering. Creating a Customer account allows you to:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    Authenticate using email and password (verified via a 6-digit one-time passcode) and/or Google OAuth sign-in.
                  </li>
                  <li>
                    Save published projects to an account-scoped shortlist (<Link href="/cart" className="text-[#155761] hover:underline">/cart</Link>) for comparison in your browser.
                  </li>
                  <li>
                    Submit project inquiries to Solution Partners and view your inquiry history (<Link href="/my-inquiries" className="text-[#155761] hover:underline">/my-inquiries</Link>).
                  </li>
                  <li>
                    Submit and track custom project requests (<Link href="/custom-project" className="text-[#155761] hover:underline">/custom-project</Link> and <Link href="/my-requests" className="text-[#155761] hover:underline">/my-requests</Link>).
                  </li>
                  <li>
                    View transaction records linked to your account or email address and access printable payment receipts for verified payments (<Link href="/my-transactions" className="text-[#155761] hover:underline">/my-transactions</Link>).
                  </li>
                  <li>
                    Create and manage support tickets with platform administrators (<Link href="/my-support" className="text-[#155761] hover:underline">/my-support</Link>).
                  </li>
                </ul>
                <p>
                  You must provide accurate, current, and complete information when registering or submitting forms on the Platform. You are responsible for maintaining the confidentiality of your password and session access. Changing your password, completing a password reset, or using &quot;Sign Out Everywhere&quot; increments your account&apos;s security token version and invalidates active sessions across devices.
                </p>
              </section>

              {/* 3. Solution Partner Status */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  3. Solution Partner Status: Approval vs. Identity Verification
                </h2>
                <p>
                  Independent developers and software studios may apply to join the Platform via <Link href="/become-a-partner" className="text-[#155761] hover:underline">/become-a-partner</Link>. The Platform maintains two separate administrative statuses for Solution Partners:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    <strong>Approved Solution Partner:</strong> Indicates that a platform administrator has reviewed and approved the applicant&apos;s partner application (<em>applicationStatus: &quot;approved&quot;</em>) to access the Partner Workspace, list projects, and receive customer inquiries while active and with confirmed partner consent. Applications may also be marked as <em>pending</em>, <em>rejected</em>, <em>suspended</em>, or <em>deactivated</em>.
                  </li>
                  <li>
                    <strong>Identity-Verified Solution Partner:</strong> Indicates a separate, optional administrative status (<em>verificationStatus: &quot;verified&quot;</em>) where identity verification records or documentation have been reviewed and marked as verified by an administrator. Where identity verification is not required or has not been completed, a partner&apos;s verification status may be <em>not_required</em>, <em>pending</em>, <em>submitted</em>, or <em>rejected</em>.
                  </li>
                </ul>
                <p>
                  Neither partner application approval nor identity-verified status constitutes an endorsement, warranty, or guarantee by {APP_NAME} of a Solution Partner&apos;s technical skill, software quality, ownership of every underlying component, delivery timeliness, commercial reliability, financial solvency, refund ability, or legal compliance. Customers are encouraged to conduct appropriate due diligence and establish clear written terms with the Solution Partner before making payments.
                </p>
              </section>

              {/* 4. Project Listings & Intellectual Property */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  4. Project Listings, Content Responsibility &amp; Intellectual Property
                </h2>
                <p>
                  Solution Partners are solely responsible for the accuracy, legality, and completeness of their project listings, including project titles, short and full descriptions, screenshots, technical specifications, technology tags, FAQs, demo URLs, pricing modes (<em>Contact</em>, <em>Fixed</em>, <em>Starting From</em>, or <em>Free</em>), promotional deal labels, and deliverables listed under &quot;What&apos;s Included&quot;.
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    <strong>Rights to List &amp; Offer:</strong> By creating or importing a project listing, the Solution Partner represents and warrants that they own or hold all necessary intellectual property rights, licenses, and permissions to showcase, distribute, customize, or license the software and any included third-party or open-source components.
                  </li>
                  <li>
                    <strong>No Unauthorized Software:</strong> Partners must not list pirated, unlicensed, plagiarized, or unlawful software, or misrepresent third-party work as their own.
                  </li>
                  <li>
                    <strong>Licensing &amp; Ownership Transfer:</strong> Purchasing or licensing a software project through a commercial arrangement with a Solution Partner does <strong>not</strong> automatically transfer copyright or exclusive intellectual property ownership unless expressly agreed between the Customer and the Solution Partner. The scope of source-code access, usage rights, redistribution restrictions, and open-source or third-party component obligations is governed by the specific agreement between the Customer and the Solution Partner.
                  </li>
                </ul>
              </section>

              {/* 5. Customer Inquiries */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  5. Customer Inquiries &amp; WhatsApp Routing
                </h2>
                <p>
                  Customers may contact an approved, active Solution Partner regarding a published project through two channels, subject to the partner&apos;s configured contact preferences:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    <strong>Platform Email Inquiries:</strong> When you submit an inquiry form on a project page (where email inquiries are enabled by the partner), the Platform stores your name, email address, optional WhatsApp number, message, selected project, assigned provider, contact method (<em>EMAIL</em> or <em>WHATSAPP</em>), inquiry status (<em>NEW</em>, <em>CONTACTED</em>, <em>DISCUSSING</em>, <em>QUOTED</em>, or <em>CLOSED</em>), notification status, and timestamps, and routes your inquiry to the relevant Solution Partner.
                  </li>
                  <li>
                    <strong>WhatsApp Direct Chat:</strong> Signed-in users may click &quot;Discuss on WhatsApp&quot; on a published project where the Solution Partner has configured a WhatsApp number and enabled WhatsApp contact. The Platform resolves a direct link (<em>wa.me</em>) that opens WhatsApp with a pre-filled inquiry message.
                  </li>
                </ul>
                <p>
                  WhatsApp is an independent third-party service operated by Meta Platforms, Inc. Any conversation conducted on WhatsApp is governed by WhatsApp&apos;s own terms of service and privacy policy. {APP_NAME} does not monitor, control, or record external WhatsApp conversations between Customers and Solution Partners.
                </p>
              </section>

              {/* 6. Custom Project Requests */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  6. Custom Project Requests
                </h2>
                <p>
                  Customers seeking bespoke software or tailored architecture may submit a request via <Link href="/custom-project" className="text-[#155761] hover:underline">/custom-project</Link>. A custom project request records your name, email address, optional WhatsApp number, project title, optional category, technology preferences, project description, required features, optional deadline/timeline, optional budget range, and any additional requirements, along with request status (<em>NEW</em>, <em>REVIEWING</em>, <em>CONTACTED</em>, <em>IN_PROGRESS</em>, <em>COMPLETED</em>, or <em>DECLINED</em>).
                </p>
                <p>
                  Submitting a custom project request is an expression of interest for scope review and coordination only and does <strong>not</strong> automatically create a binding development contract. Any commercial scope, deliverables, milestones, pricing, intellectual property ownership, and licensing terms must be agreed separately between the relevant parties.
                </p>
              </section>

              {/* 7. Transactions & Payment Records */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  7. Transactions, Installments &amp; Payment Evidence Records
                </h2>
                <p>
                  When a Customer and an approved Solution Partner enter into a commercial transaction, the Solution Partner may record the transaction in the Partner Workspace for record-keeping, installment tracking, and receipt generation:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    <strong>Recorded Transaction Details:</strong> Each transaction record includes a unique transaction number, customer name, customer email, optional customer WhatsApp number, partner reference, optional linked project/solution and inquiry, total submitted amount, agreed deal amount, currency (defaulting to INR), transaction date, payment method (such as <em>UPI</em>, <em>IMPS</em>, <em>NEFT/RTGS</em>, <em>Bank Transfer</em>, <em>Card</em>, <em>Wire Transfer</em>, <em>Cash</em>, or <em>Other</em>), UTR/reference number(s), payment evidence screenshot URL(s), optional payment evidence notes, project type (<em>Existing Solution</em>, <em>Customized Existing Solution</em>, or <em>New Solution for Customer</em>), optional description, delivery status (<em>Pending</em>, <em>In Progress</em>, <em>Delivered</em>, or <em>Completed</em>), verification metadata, and verification source (currently <em>manual_provider_submission</em>).
                  </li>
                  <li>
                    <strong>Installment Payments:</strong> A transaction may record up to three (3) active (non-rejected) payment entries. Each payment entry tracks its sequence number, amount, payment method, UTR/reference number (where required for non-cash methods), uploaded payment evidence URL, and individual review status (<em>PENDING_REVIEW</em>, <em>VERIFIED</em>, or <em>REJECTED</em>).
                  </li>
                  <li>
                    <strong>Transaction Payment Statuses:</strong> Parent transaction records carry statuses including <em>Pending</em>, <em>Evidence Submitted</em>, <em>Under Review</em>, <em>Verified</em>, <em>Rejected</em>, <em>Refunded</em>, <em>Disputed</em>, and <em>Completed</em>.
                  </li>
                  <li>
                    <strong>Meaning of Platform Verification:</strong> Unless a payment is processed through an integrated payment gateway (if enabled in the future), {APP_NAME} does <strong>not</strong> connect to banks or UPI switches to independently verify bank settlement. When a payment or transaction is marked as <em>Verified</em> on the Platform, it means a platform administrator has reviewed the payment evidence and reference details submitted through the Platform and marked the record as verified in the system.
                  </li>
                </ul>
              </section>

              {/* 8. Receipts */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  8. Digital Receipts &amp; What They Represent
                </h2>
                <p>
                  Printable payment receipts (<Link href="/my-transactions" className="text-[#155761] hover:underline">/my-transactions</Link>) are generated only for individual payment entries that have been marked as <em>VERIFIED</em>. Each receipt is numbered sequentially (e.g., <em>TXN-...-R1</em>) and is labeled either as a <em>Payment Receipt</em> (for a partial installment) or <em>Paid in Full</em> (when cumulative verified payments reach the agreed transaction amount).
                </p>
                <p className="font-medium text-[#102124]">
                  Important Distinction: A receipt generated on {APP_NAME} is a computer-generated record of a transaction and payment entry recorded by the Solution Partner (and marked as verified based on submitted payment evidence) as issued by the Solution Partner via {APP_NAME}. Unless {APP_NAME} explicitly collected the payment directly, a platform receipt is not proof that {APP_NAME} itself received or holds the funds, nor is it a substitute for official bank settlement confirmation.
                </p>
              </section>

              {/* 9. Refunds, Cancellations & Disputes */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  9. Refunds, Cancellations &amp; Commercial Disputes
                </h2>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    Because payments are made directly between the Customer and the Solution Partner, all cancellation, milestone, and refund terms are governed by the agreement between the Customer and that Solution Partner.
                  </li>
                  <li>
                    {APP_NAME} does not hold customer funds in escrow and does not owe refunds for payments that {APP_NAME} did not receive.
                  </li>
                  <li>
                    If a commercial or delivery issue arises, Customers should first contact the relevant Solution Partner directly to seek resolution.
                  </li>
                  <li>
                    Customers and Solution Partners may also report platform-related concerns, suspected fraud, or policy violations by opening a support ticket (<Link href="/my-support" className="text-[#155761] hover:underline">/my-support</Link> or <Link href="/partner/support" className="text-[#155761] hover:underline">/partner/support</Link>). Where appropriate, administrators may review reported issues, update a transaction record&apos;s status on the Platform to <em>Disputed</em> or <em>Refunded</em> to reflect the state of the record, or take moderation action against accounts that violate platform rules.
                  </li>
                </ul>
              </section>

              {/* 10. Delivery & Customization */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  10. Project Delivery, Customization &amp; Performance Disclaimers
                </h2>
                <p>
                  Unless {APP_NAME} has expressly agreed in writing to deliver a project directly, {APP_NAME} does not guarantee project delivery, development timelines, customization quality, bug-free operation, third-party API or hosting compatibility, ongoing maintenance, post-handover technical support, or successful production deployment of any Solution Partner&apos;s software. Marking a transaction&apos;s delivery status as <em>Delivered</em> or <em>Completed</em> on the Platform reflects administrative or partner record tracking and is gated on the agreed transaction balance being marked verified in the system.
                </p>
              </section>

              {/* 11. Acceptable Use */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  11. Acceptable Use &amp; Prohibited Conduct
                </h2>
                <p>
                  You agree to use {APP_NAME} lawfully and in good faith. You must not:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    Submit fraudulent, deceptive, or automated spam inquiries or custom project requests.
                  </li>
                  <li>
                    Scrape, harvest, or misuse protected Solution Partner contact details, or bypass rate limits, Cloudflare Turnstile challenges, or other security controls.
                  </li>
                  <li>
                    Attempt unauthorized access to another user&apos;s account, Partner Workspace, administrative endpoints, or platform infrastructure.
                  </li>
                  <li>
                    Upload or distribute malicious code, unlawful content, or material that infringes third-party copyrights, trademarks, or trade secrets.
                  </li>
                  <li>
                    Impersonate another person, developer, studio, or organization.
                  </li>
                  <li>
                    Submit fabricated, altered, duplicate, or fraudulent UTR/reference numbers, payment screenshots, or transaction records, or misuse platform-generated receipts.
                  </li>
                </ul>
              </section>

              {/* 12. User Content */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  12. User &amp; Partner Submitted Content
                </h2>
                <p>
                  You retain ownership of the content you submit to {APP_NAME}, including project descriptions, screenshots, technical specifications, partner profile details, inquiry messages, custom project requests, support ticket messages and attachments, payment evidence screenshots, and transaction notes. By submitting content to the Platform, you represent that you have the lawful right to provide it and grant {APP_NAME} a non-exclusive right to host, store, process, display (where public, such as published listings and public partner profiles), and transmit that content as necessary to operate and secure the Platform.
                </p>
              </section>

              {/* 13. Account Deletion & Termination */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  13. Account Deletion &amp; Record Retention
                </h2>
                <p>
                  Non-admin Customers and Solution Partners may initiate account deletion from their account settings (<Link href="/profile" className="text-[#155761] hover:underline">/profile</Link>). In accordance with the Platform&apos;s implementation:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    Your user login record, active sessions, linked OAuth account records, and support tickets are deleted.
                  </li>
                  <li>
                    If you have a Solution Partner profile, your partner profile is deactivated, its email address is replaced with an archived internal placeholder so your email is released, and your projects are set to <em>ARCHIVED</em> so they are no longer publicly listed.
                  </li>
                  <li>
                    Existing inquiries, custom project requests, and transaction records are unlinked from your deleted user account ID, while the underlying inquiry, custom request, transaction, payment, and audit log records are retained where reasonably necessary for transaction history, partner record-keeping, fraud prevention, dispute handling, security, and audit integrity, as described in our <Link href="/privacy" className="text-[#155761] font-semibold hover:underline">Privacy Policy</Link>.
                  </li>
                </ul>
              </section>

              {/* 14. Platform Suspension */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  14. Platform Moderation, Suspension &amp; Termination
                </h2>
                <p>
                  {APP_NAME} administrators may moderate project listings (including unpublishing or archiving projects, managing featured status, or adding moderation notes) and may reject, suspend, or deactivate Solution Partner profiles or terminate user accounts where reasonably necessary to address suspected fraud, false payment evidence, intellectual property infringement, security violations, abusive behavior, or repeated violations of these Terms. When a Solution Partner profile is deactivated or suspended, its published projects are automatically removed from the public catalog.
                </p>
              </section>

              {/* 15. Disclaimers & Liability */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  15. Disclaimers &amp; Limitation of Liability
                </h2>
                <p>
                  The {APP_NAME} platform and catalog listings are provided on an &quot;as-is&quot; and &quot;as-available&quot; basis. We distinguish between:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    <strong>Platform Functionality:</strong> While we strive to maintain reliable discovery, routing, and record-keeping tools, we do not warrant uninterrupted or error-free operation of the Platform.
                  </li>
                  <li>
                    <strong>Independent Solution Partner Services:</strong> Solution Partners are independent third parties and not employees, agents, or subcontractors of {APP_NAME}. {APP_NAME} is not responsible for the acts, omissions, representations, code quality, or contractual performance of any Solution Partner.
                  </li>
                  <li>
                    <strong>Third-Party Services:</strong> Features that rely on external providers (such as Google OAuth, WhatsApp deep links, Cloudflare Turnstile, Cloudinary media delivery, or email delivery infrastructure) depend on the availability and terms of those third parties.
                  </li>
                </ul>
                <p>
                  To the maximum extent permitted by applicable law, {APP_NAME} and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, data, business, or funds arising out of or related to third-party software listings, payment arrangements between Customers and Solution Partners, or your use of the Platform. Nothing in these Terms excludes or limits any liability that cannot lawfully be excluded or limited under applicable Indian law.
                </p>
              </section>

              {/* 16. Indemnification */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  16. Indemnification
                </h2>
                <p>
                  To the extent permitted by applicable law, you agree to indemnify and hold harmless {APP_NAME} and its operators from and against reasonable claims, losses, liabilities, and expenses arising out of your unlawful activity, your breach of these Terms, your infringement of third-party intellectual property or proprietary rights, your misuse of the Platform, or your submission of false or fraudulent project listings, inquiries, payment evidence, or transaction information.
                </p>
              </section>

              {/* 17. Governing Law */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  17. Governing Law &amp; Support Contact
                </h2>
                <p>
                  These Terms &amp; Conditions are governed by and construed in accordance with the laws of India, and should be read together with our <Link href="/privacy" className="text-[#155761] font-semibold hover:underline">Privacy Policy</Link>. If you have questions regarding these Terms, a project listing, or a transaction record, please visit our <Link href="/support" className="text-[#155761] font-semibold hover:underline">Help Center</Link> or open a support ticket via your <Link href="/my-support" className="text-[#155761] font-semibold hover:underline">Support Dashboard</Link>.
                </p>
              </section>

              {/* 18. Changes to Terms */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  18. Changes to These Terms
                </h2>
                <p>
                  We may update these Terms &amp; Conditions from time to time to reflect changes in platform functionality, operational practices, or legal requirements. When we make updates, we will revise the Effective Date and Version number at the top of this page and, where appropriate for material changes, provide notice through the Platform.
                </p>
                <div className="p-4 rounded-2xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-between gap-4 text-xs text-[#102124]">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#155761] shrink-0" />
                    <span>
                      Need assistance with an inquiry, transaction record, or partner listing?
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

