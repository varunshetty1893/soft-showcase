// app/privacy/page.tsx
// Public Privacy Policy page for Soft Showcase.
// Grounded strictly in the platform's actual Prisma schema, APIs, authentication,
// account deletion logic, and aligned with the Terms & Conditions (/terms).

import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { APP_NAME } from "@/config/constants";
import { ChevronRight, Shield, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: `Privacy Policy — ${APP_NAME}`,
  description:
    "Privacy Policy explaining how Soft Showcase collects, processes, shares, retains, and safeguards information across customer accounts, Solution Partner profiles, inquiries, custom project requests, and transaction records.",
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
              {/* 1. Personal Information Actually Collected */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-[#102124]">
                  1. Personal Information We Collect
                </h2>
                <p>
                  This Privacy Policy describes the information <strong>{APP_NAME}</strong> (&quot;the Platform&quot;) collects and processes when you use our services, and should be read alongside our{" "}
                  <Link href="/terms" className="text-[#155761] font-semibold hover:underline">
                    Terms &amp; Conditions
                  </Link>
                  . Depending on how you interact with the Platform, we collect and store the following categories of information:
                </p>

                <div className="space-y-2.5 pl-1">
                  <div>
                    <h3 className="text-sm font-bold text-[#102124]">
                      1.1 Account Information
                    </h3>
                    <p>
                      When you register or sign in, we store your name, email address, email verification timestamp, bcrypt password hash (for email/password accounts — {APP_NAME} never stores raw passwords), optional WhatsApp number, optional secondary contact email, profile image URL, account role (<em>customer</em>, <em>solution_partner</em>, or <em>admin</em>), administrative flag, session security token version, OAuth provider account identifiers/tokens (when signing in with Google), and hashed one-time verification or password-reset codes while pending.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#102124]">
                      1.2 Solution Partner Information
                    </h3>
                    <p>
                      When you apply for or manage a Solution Partner profile (<Link href="/become-a-partner" className="text-[#155761] hover:underline">/become-a-partner</Link>), we store your display name, email address, optional WhatsApp number, biography, avatar URL, skills, technologies, experience summary, portfolio URL, GitHub URL, LinkedIn URL, solutions offered, expertise areas, location, contact visibility preferences (<em>showEmail</em> and <em>showWhatsapp</em>), partner consent confirmation and timestamp, application status (<em>pending</em>, <em>approved</em>, <em>rejected</em>, <em>suspended</em>, or <em>deactivated</em>), approval/rejection metadata and admin notes, and optional identity verification records (<em>verificationStatus</em>, verification timestamp, reviewer ID, verification notes, and verification document URL where applicable).
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#102124]">
                      1.3 Inquiry Information
                    </h3>
                    <p>
                      When you submit an inquiry on a published project page, we store your name, email address, optional WhatsApp number, inquiry message, selected project ID, assigned Solution Partner/provider ID, optional linked customer account ID, preferred contact method (<em>EMAIL</em> or <em>WHATSAPP</em>), inquiry status (<em>NEW</em>, <em>CONTACTED</em>, <em>DISCUSSING</em>, <em>QUOTED</em>, or <em>CLOSED</em>), email notification delivery status (<em>PENDING</em>, <em>SENT</em>, <em>FAILED</em>, or <em>THROTTLED</em>), optional administrative notes, and submission/update timestamps.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#102124]">
                      1.4 Custom Project Request Information
                    </h3>
                    <p>
                      When you submit a custom project request via <Link href="/custom-project" className="text-[#155761] hover:underline">/custom-project</Link>, we store your name, email address, optional WhatsApp number, project title, optional category, technology preferences, project description, required features, optional deadline/timeline, optional budget range, optional additional requirements, request status (<em>NEW</em>, <em>REVIEWING</em>, <em>CONTACTED</em>, <em>IN_PROGRESS</em>, <em>COMPLETED</em>, or <em>DECLINED</em>), notification status, optional administrative notes, and optional link to your customer account.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#102124]">
                      1.5 Transaction &amp; Installment Information
                    </h3>
                    <p>
                      When a Solution Partner records a transaction on the Platform, we store the transaction number, customer name, customer email, optional customer WhatsApp number, optional linked customer account ID, partner ID, optional linked project/solution ID and inquiry ID, total submitted amount, agreed deal amount, currency, transaction date, payment method, UTR/reference number and array of UTR numbers, payment evidence URL(s) and notes, payment status (<em>PENDING</em>, <em>EVIDENCE_SUBMITTED</em>, <em>UNDER_REVIEW</em>, <em>VERIFIED</em>, <em>REJECTED</em>, <em>REFUNDED</em>, <em>DISPUTED</em>, or <em>COMPLETED</em>), project type (<em>EXISTING_SOLUTION</em>, <em>CUSTOMIZED_EXISTING_SOLUTION</em>, or <em>NEW_SOLUTION_FOR_CUSTOMER</em>), optional description, delivery status (<em>PENDING</em>, <em>IN_PROGRESS</em>, <em>DELIVERED</em>, or <em>COMPLETED</em>), verification metadata (<em>verifiedAt</em>, <em>verifiedBy</em>, <em>adminNotes</em>), verification source (defaulting to <em>manual_provider_submission</em>, with schema fields reserved for future payment-gateway identifiers if used), and individual installment payment rows (sequence, amount, currency, payment method, UTR/reference number, evidence URL, review status, rejection reason, and timestamps).
                    </p>
                    <p className="font-medium text-[#102124] mt-1">
                      What We Do Not Collect: {APP_NAME} does not collect or store credit or debit card numbers, card CVVs, banking login passwords, or UPI PINs.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#102124]">
                      1.6 Support Ticket &amp; Audit Information
                    </h3>
                    <p>
                      When you open or reply to a support ticket (<Link href="/my-support" className="text-[#155761] hover:underline">/my-support</Link> or <Link href="/partner/support" className="text-[#155761] hover:underline">/partner/support</Link>), we store the ticket number, requester ID and role, subject, category, description, status, priority, messages, optional attachment URLs/names, and administrative resolution notes. We also record platform audit logs for administrative, moderation, authentication, and transaction events, as well as client IP addresses and request headers (such as user-agent and accept-language) for rate limiting and abuse prevention.
                    </p>
                  </div>
                </div>
              </section>

              {/* 2. Payment Evidence */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  2. Payment Evidence &amp; UTR Records
                </h2>
                <p>
                  Solution Partners may upload payment screenshots (payment evidence) and enter UTR or transaction reference numbers when recording customer payments. Where configured, a Solution Partner may also use the Platform&apos;s optional receipt-extraction helper, which transmits the payment screenshot to Google Gemini Vision API to assist in reading the amount, currency, 12-digit UTR/reference number, payment method, and date before submission.
                </p>
                <p>
                  Payment evidence and UTR/reference information are stored and processed for:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Transaction and installment record keeping between the Customer and Solution Partner.</li>
                  <li>Administrative review to mark submitted payment entries as <em>VERIFIED</em> or <em>REJECTED</em> (and prevent duplicate UTR reuse across active payment records).</li>
                  <li>Generating printable digital receipts (<Link href="/my-transactions" className="text-[#155761] hover:underline">/my-transactions</Link>) for verified payment entries.</li>
                  <li>Handling status updates, refund notations, or commercial dispute reviews on the Platform.</li>
                </ul>
                <p>
                  As explained in our <Link href="/terms" className="text-[#155761] hover:underline">Terms &amp; Conditions</Link>, administrative review of payment evidence does not constitute direct verification with banking institutions or payment networks.
                </p>
              </section>

              {/* 3. Purposes of Processing */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  3. Purposes of Processing
                </h2>
                <p>
                  We process the information described above for the following specific purposes:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>Account Authentication &amp; Management:</strong> Verifying email ownership via OTP, authenticating sessions, managing passwords, and enforcing role-based access controls.</li>
                  <li><strong>Project Discovery &amp; Shortlisting:</strong> Displaying published software projects and maintaining account-isolated project shortlists.</li>
                  <li><strong>Customer Enquiries &amp; Partner Communication:</strong> Recording customer inquiries, sending email notifications, and facilitating direct communication with the relevant Solution Partner.</li>
                  <li><strong>Custom Project Coordination:</strong> Receiving, reviewing, and responding to custom software build requests.</li>
                  <li><strong>Transaction Records &amp; Receipts:</strong> Recording partner-submitted payment entries, conducting administrative evidence review, and providing printable receipts for verified payments.</li>
                  <li><strong>Customer &amp; Partner Support:</strong> Managing and resolving support tickets through the Customer and Partner support portals.</li>
                  <li><strong>Security, Fraud &amp; Abuse Prevention:</strong> Enforcing IP and email rate limits, validating Cloudflare Turnstile challenges, preventing duplicate UTR submissions, and protecting partner contact details from scraping.</li>
                  <li><strong>Moderation, Audit Logging &amp; Legal Compliance:</strong> Reviewing partner applications and project listings, maintaining administrative audit trails, and complying with applicable legal obligations.</li>
                </ul>
              </section>

              {/* 4. Customer -> Partner Data Sharing */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  4. Customer-to-Partner Data Sharing &amp; WhatsApp Routing
                </h2>
                <p>
                  When you submit a project inquiry, the information you provide in that inquiry — specifically your name, email address, optional WhatsApp number, inquiry message, and the project you inquired about — is shared with the approved Solution Partner who owns that project listing (both in their Partner Workspace inquiry dashboard and via email notification when enabled) so they can respond to you directly.
                </p>
                <p>
                  When a signed-in user clicks &quot;Discuss on WhatsApp&quot; on a project page where WhatsApp contact is enabled, the Platform generates a direct <em>wa.me</em> link to open a chat with that Solution Partner on WhatsApp. Other private customer account data (such as unrelated inquiries, unrelated transactions, or your password hash) is not shared with Solution Partners or made publicly visible.
                </p>
              </section>

              {/* 5. Public Partner Information */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  5. Public vs. Internal Solution Partner Information
                </h2>
                <p>
                  We distinguish between Solution Partner information displayed publicly and information held internally:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    <strong>Public Partner Information:</strong> On published project pages, only the partner&apos;s public creator profile fields — such as display name, biography, avatar image, location, portfolio link, GitHub link, LinkedIn link, and boolean indicators of whether email inquiry or WhatsApp contact is enabled — are displayed. Raw partner email addresses and raw WhatsApp phone numbers are stripped from public project page responses to prevent automated scraping, and WhatsApp links are resolved server-side only for authenticated users when <em>showWhatsapp</em> is enabled.
                  </li>
                  <li>
                    <strong>Private &amp; Internal Partner Information:</strong> Application review notes, rejection reasons, consent timestamps, identity verification status and documents (<em>verificationDocumentUrl</em> and <em>verificationNotes</em>), deactivated/archived email records, and transaction management records are restricted to authorized platform administrators (and, where applicable, the partner&apos;s own workspace) for approval, verification, moderation, security, and transaction administration.
                  </li>
                </ul>
              </section>

              {/* 6. Google OAuth */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  6. Google OAuth Authentication
                </h2>
                <p>
                  If you choose to sign in using Google OAuth, Google provides {APP_NAME} with your basic profile information — specifically your Google account identifier, name, email address, email-verified status, and profile picture URL. We require your Google email address to be verified by Google before permitting sign-in, and to prevent unauthorized account takeover, Google OAuth sign-in will not automatically link to an existing password-protected account unless Google authentication is already linked to that account. We do not request access to your private Google Workspace files, contacts, or calendars.
                </p>
              </section>

              {/* 7. Cookies & Local Storage */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  7. Cookies, Sessions &amp; Browser Local Storage
                </h2>
                <p>
                  {APP_NAME} uses strictly necessary cookies and local browser storage to operate the Platform:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    <strong>Authentication &amp; CSRF Cookies:</strong> NextAuth.js sets HTTP-only JWT session cookies (with a 30-day maximum age unless you sign out or your session token version is invalidated) and cross-site request forgery (CSRF) protection cookies.
                  </li>
                  <li>
                    <strong>Browser Local Storage:</strong> When you are signed in, the Saved Projects Shortlist (<Link href="/cart" className="text-[#155761] hover:underline">/cart</Link>) stores your shortlisted project items in your browser&apos;s <em>localStorage</em> under a key scoped to your authenticated user ID or email address (<em>softshowcase_cart_user_...</em>) so different accounts sharing a browser do not see each other&apos;s saved items.
                  </li>
                  <li>
                    <strong>No Advertising Cookies:</strong> {APP_NAME} does not use third-party behavioral advertising or cross-site tracking cookies.
                  </li>
                </ul>
              </section>

              {/* 8. Third-Party Services */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  8. Third-Party Services &amp; Infrastructure
                </h2>
                <p>
                  Depending on the active deployment configuration, {APP_NAME} integrates with the following infrastructure and service providers:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>PostgreSQL Database (Neon / Managed PostgreSQL):</strong> Stores application accounts, partner profiles, projects, inquiries, custom requests, transactions, support tickets, and audit logs.</li>
                  <li><strong>Cloud Application Hosting (e.g., Vercel / Cloud Run):</strong> Hosts and serves the web application and API routes.</li>
                  <li><strong>Google OAuth 2.0:</strong> Authenticates users who choose &quot;Sign in with Google&quot;.</li>
                  <li><strong>Upstash Redis:</strong> Provides distributed rate limiting and email-dispatch throttling counters in production environments.</li>
                  <li><strong>Cloudflare Turnstile:</strong> Validates anti-bot security challenges on unauthenticated inquiry and custom project request submissions when configured.</li>
                  <li><strong>Cloudinary:</strong> Hosts and delivers uploaded project screenshots, avatars, and payment evidence images.</li>
                  <li><strong>Google Gemini Vision API (Optional Partner Helper):</strong> When configured with a server-side API key, processes partner-submitted payment screenshots on request to extract payment amount, UTR, method, and date fields.</li>
                  <li><strong>WhatsApp (Meta Platforms, Inc.):</strong> External destination when a signed-in user opens a generated <em>wa.me</em> link to chat with a Solution Partner.</li>
                </ul>
              </section>

              {/* 9. Email */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  9. Transactional Email Delivery
                </h2>
                <p>
                  Transactional emails — including 6-digit registration OTPs, password reset codes, customer inquiry confirmations, Solution Partner inquiry alerts, custom project request notifications, and partner moderation notices — are delivered through the Platform&apos;s configured email service provider (such as an authenticated SMTP relay / Gmail SMTP, or another configured mail provider depending on the deployment environment).
                </p>
              </section>

              {/* 10. Data Retention */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  10. Data Retention
                </h2>
                <p>
                  We retain personal and operational information for as long as reasonably necessary to fulfill the purposes described in this policy:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong>Active Accounts &amp; Partner Profiles:</strong> Retained while your Customer or Solution Partner account remains active so you can access your workspace and history.</li>
                  <li><strong>Verification &amp; Password-Reset Codes:</strong> One-time registration passcodes (<em>PendingRegistration</em>) and password-reset tokens (<em>VerificationToken</em>) are issued with a 15-minute expiration window, allow at most 5 verification attempts, and are deleted upon successful verification/reset or when invalidated after failed attempts.</li>
                  <li><strong>Inquiries, Custom Requests, Transactions &amp; Payment Evidence:</strong> Retained as reasonably necessary to maintain customer and partner transaction histories, support verifiable receipts, prevent duplicate UTR fraud, resolve commercial or platform disputes, and satisfy legitimate record-keeping and legal obligations.</li>
                  <li><strong>Support Tickets &amp; Audit Logs:</strong> Support tickets are retained while the requester&apos;s account remains active (and deleted if the requester deletes their account), while administrative and security audit logs are retained for platform security, moderation accountability, and fraud investigation.</li>
                </ul>
              </section>

              {/* 11. Account Deletion */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  11. Account Deletion &amp; Historical Records
                </h2>
                <p>
                  Non-admin users can initiate account deletion from their profile settings (<Link href="/profile" className="text-[#155761] hover:underline">/profile</Link>) by confirming their account email address. When account deletion is executed:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Your <em>User</em> record, active <em>Session</em> records, linked OAuth <em>Account</em> records, and <em>SupportTicket</em> records (along with their messages) are permanently deleted from the database.</li>
                  <li>If you have an associated Solution Partner profile (<em>ProjectProvider</em>), it is unlinked from your user ID, marked inactive and <em>deactivated</em>, its email field is replaced with an internal archived placeholder (<em>archived_...@archived.local</em>) so your email address is freed, and any associated projects are updated to <em>ARCHIVED</em> status so they are removed from public listings.</li>
                  <li>Existing <em>Inquiry</em>, <em>CustomProjectRequest</em>, and <em>Transaction</em> records are unlinked from your deleted user account ID (<em>customerId</em> is set to <em>null</em>). However, the underlying inquiry, custom request, transaction, payment evidence, and audit log records (including contact and payment details recorded on those records and an audit log entry of the account deletion) remain stored where reasonably necessary for partner records, transaction history, receipt integrity, fraud prevention, dispute handling, and security auditing.</li>
                </ul>
              </section>

              {/* 12. Data Security */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  12. Data Security Measures
                </h2>
                <p>
                  We implement reasonable technical and organizational measures designed to protect information on the Platform, including:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Bcrypt hashing for user passwords and SHA-256 hashing for stored OTP and password-reset codes.</li>
                  <li>Server-side role and ownership checks across customer, partner, and administrative API routes, plus session invalidation via token versioning when passwords are changed or reset.</li>
                  <li>Strict schema validation, magic-byte file signature checks (JPEG, PNG, WebP) on image uploads, and domain allowlisting for payment evidence URLs.</li>
                  <li>Server-side stripping of raw Solution Partner email addresses and phone numbers from public project page payloads, combined with multi-layer IP and email rate limiting.</li>
                </ul>
                <p>
                  While we work to safeguard your data, no method of electronic transmission or storage over the internet can be guaranteed to be completely secure against all possible risks.
                </p>
              </section>

              {/* 13. User Rights */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  13. Your Privacy Rights &amp; Grievance Redressal
                </h2>
                <p>
                  Subject to applicable Indian data protection laws and other applicable regulations, you may:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Access and review your account profile, inquiries, custom requests, transactions, and support tickets through your account dashboard.</li>
                  <li>Update or correct your name, WhatsApp number, and contact email in <Link href="/profile" className="text-[#155761] hover:underline">/profile</Link> (and, for Solution Partners, update studio details and public contact visibility toggles in <Link href="/partner/profile" className="text-[#155761] hover:underline">/partner/profile</Link>).</li>
                  <li>Delete your account via the self-service deletion option in <Link href="/profile" className="text-[#155761] hover:underline">/profile</Link>, subject to the retention of unlinked historical records described in Section 11.</li>
                  <li>Submit privacy questions, data access/correction requests, or grievances by opening a support ticket in your <Link href="/my-support" className="text-[#155761] hover:underline">Customer Support Dashboard</Link> (<Link href="/partner/support" className="text-[#155761] hover:underline">/partner/support</Link> for Solution Partners).</li>
                </ul>
              </section>

              {/* 14. Children */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  14. Children&apos;s Privacy
                </h2>
                <p>
                  {APP_NAME} is a B2B and professional software discovery platform intended for businesses, developers, engineering teams, and individuals capable of entering into lawful commercial agreements under applicable law. We do not knowingly solicit or collect personal information from children. If you believe a child has submitted personal data to the Platform without appropriate authorization, please contact us through our support channels so we can take appropriate steps to review and remove the information.
                </p>
              </section>

              {/* 15. Security Incidents */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  15. Security Incidents
                </h2>
                <p>
                  In the event of a confirmed security incident affecting personal data stored on the Platform, we will investigate the incident, take reasonable steps to mitigate potential harm and restore security, and handle notifications in accordance with applicable law and our internal security procedures.
                </p>
              </section>

              {/* 16. Data Sales */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  16. No Sale of Personal Data
                </h2>
                <p className="font-medium text-[#102124]">
                  {APP_NAME} does not sell, rent, or trade your personal information or inquiry leads to third-party data brokers or advertising networks.
                </p>
              </section>

              {/* 17. Privacy Contact */}
              <section className="space-y-2">
                <h2 className="text-base font-bold text-[#102124]">
                  17. Privacy Contact &amp; Updates
                </h2>
                <p>
                  If you have questions, concerns, or requests regarding this Privacy Policy or how your data is handled on <strong>{APP_NAME}</strong>, please visit our{" "}
                  <Link href="/support" className="text-[#155761] font-semibold hover:underline">
                    Help Center
                  </Link>{" "}
                  or submit a support ticket through your{" "}
                  <Link href="/my-support" className="text-[#155761] font-semibold hover:underline">
                    Customer Support Dashboard
                  </Link>{" "}
                  (or{" "}
                  <Link href="/partner/support" className="text-[#155761] font-semibold hover:underline">
                    Partner Support Desk
                  </Link>
                  ). When we update this Privacy Policy, we will revise the Effective Date and Version number at the top of this page.
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


