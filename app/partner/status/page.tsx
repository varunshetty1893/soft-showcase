// app/partner/status/page.tsx
// Displays the current Solution Partner application status for the user with email lookup.

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Headphones,
  Mail,
  Search,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Partner Application Status — ${APP_NAME}`,
  robots: { index: false },
};

interface PartnerStatusPageProps {
  searchParams?: Promise<{ email?: string; submitted?: string; verified?: string }>;
}

export default async function PartnerStatusPage({ searchParams }: PartnerStatusPageProps) {
  const session = await auth();
  const params = await searchParams;
  const lookupEmail = params?.email?.trim().toLowerCase();
  const justVerified = params?.verified === "true";
  const justSubmitted = params?.submitted === "true";

  let partner = null;
  let user = null;

  if (lookupEmail) {
    user = await db.user.findUnique({
      where: { email: lookupEmail },
    });

    partner = await db.projectProvider.findFirst({
      where: { email: lookupEmail },
    });

    if (!partner && user) {
      partner = await db.projectProvider.findFirst({
        where: { userId: user.id },
      });
    }
  }

  if (!partner && session?.user) {
    user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    partner = await db.projectProvider.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: (session.user.email || "").toLowerCase() },
        ],
      },
    });
  }

  const effectiveEmail = lookupEmail || session?.user?.email || "";
  const isEmailVerified = Boolean(user?.emailVerified);

  let status: string;
  if (partner) {
    status = partner.applicationStatus;
  } else if (effectiveEmail) {
    status = "not_applied";
  } else {
    status = "unauthenticated";
  }

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
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#526267] hover:text-[#155761] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Showcase</span>
          </Link>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl w-full bg-white rounded-3xl border border-[#D9E2E4] p-8 sm:p-10 shadow-sm text-center space-y-6">
          {/* Banner for newly verified / submitted */}
          {justVerified && (
            <div className="p-3.5 rounded-2xl bg-[#DDF4EC] border border-[#2F7D78]/30 text-[#155761] text-xs flex items-center gap-2.5 text-left">
              <CheckCircle2 className="w-5 h-5 text-[#2F7D78] shrink-0" />
              <span>
                <strong>Email Confirmed!</strong> Your email address has been successfully verified.
              </span>
            </div>
          )}

          {justSubmitted && !justVerified && (
            <div className="p-3.5 rounded-2xl bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] text-xs flex items-center gap-2.5 text-left">
              <CheckCircle2 className="w-5 h-5 text-[#2F7D78] shrink-0" />
              <span>
                <strong>Application Received!</strong> Your partner registration was submitted.
              </span>
            </div>
          )}

          {/* Verification Warning if unverified user */}
          {user && !isEmailVerified && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Action Needed: Email Verification Pending</span>
              </div>
              <p>
                We sent a 6-digit confirmation code and link to{" "}
                <strong>{effectiveEmail}</strong>. Please verify your email to complete your partner profile activation.
              </p>
              <Link
                href={`/verify-email?email=${encodeURIComponent(effectiveEmail)}&role=partner`}
                className="inline-flex items-center gap-1.5 font-bold text-[#155761] hover:underline"
              >
                <span>Enter Verification Code</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Status: Pending Review */}
          {status === "pending" && (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
                <Clock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
                  Under Review
                </span>
                <h1 className="text-2xl font-bold text-[#102124]">
                  Application Under Review
                </h1>
                <p className="text-sm text-[#526267] leading-relaxed">
                  Your Solution Partner application has been received and is currently under review by the Soft Showcase platform administration.
                </p>
              </div>

              <div className="bg-[#F8FAFA] rounded-2xl p-5 border border-[#D9E2E4] text-xs text-[#526267] text-left space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#D9E2E4] pb-2">
                  <span className="font-semibold text-[#102124]">Application Overview</span>
                  <span className="font-mono text-[11px] text-[#2F7D78] font-bold">
                    {isEmailVerified ? "Email Verified ✓" : "Verification Pending"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#8A9B9F] block">Studio / Partner</span>
                    <strong className="text-[#102124]">{partner?.displayName}</strong>
                  </div>
                  <div>
                    <span className="text-[#8A9B9F] block">Registered Email</span>
                    <strong className="text-[#102124] truncate block">{partner?.email}</strong>
                  </div>
                  {partner?.whatsappNumber && (
                    <div>
                      <span className="text-[#8A9B9F] block">WhatsApp</span>
                      <strong className="text-[#102124]">{partner?.whatsappNumber}</strong>
                    </div>
                  )}
                  {partner?.location && (
                    <div>
                      <span className="text-[#8A9B9F] block">Location</span>
                      <strong className="text-[#102124]">{partner?.location}</strong>
                    </div>
                  )}
                </div>
                <div className="pt-2 border-t border-[#D9E2E4] text-[11px] text-[#526267] space-y-1">
                  <p>• Architectural evaluation turnaround: 24–48 business hours.</p>
                  <p>• Once approved, your Partner Portal dashboard will activate automatically.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/my-support/new"
                  className={buttonVariants({
                    variant: "outline",
                    className: "w-full sm:w-auto gap-1.5 text-xs",
                  })}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Contact Support</span>
                </Link>
                <Link
                  href="/"
                  className={buttonVariants({
                    variant: "primary",
                    className: "w-full sm:w-auto text-xs",
                  })}
                >
                  Explore Showcase
                </Link>
              </div>
            </>
          )}

          {/* Status: Approved */}
          {status === "approved" && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#DDF4EC] text-[#2F7D78] flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-[#DDF4EC] text-[#2F7D78] text-xs font-bold uppercase tracking-wider">
                  Approved
                </span>
                <h1 className="text-2xl font-bold text-[#102124]">
                  Solution Partner Account Approved
                </h1>
                <p className="text-sm text-[#526267] leading-relaxed">
                  Congratulations! Your Solution Partner account has been approved. You now have full access to your Partner Portal to publish software solutions, manage client inquiries, and record transactions.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/partner/dashboard"
                  className={buttonVariants({
                    variant: "primary",
                    size: "lg",
                    className: "w-full gap-2 font-bold shadow-md cursor-pointer",
                  })}
                >
                  <span>Enter Partner Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}

          {/* Status: Rejected */}
          {status === "rejected" && (
            <>
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-xs">
                <XCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider">
                  Not Approved
                </span>
                <h1 className="text-2xl font-bold text-[#102124]">
                  Application Status
                </h1>
                <p className="text-sm text-[#526267] leading-relaxed">
                  Your Solution Partner application was evaluated and could not be approved at this time.
                </p>
                {partner?.rejectionReason && (
                  <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 text-left">
                    <strong>Reviewer Feedback:</strong> {partner.rejectionReason}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/my-support/new"
                  className={buttonVariants({
                    variant: "outline",
                    className: "w-full sm:w-auto text-xs",
                  })}
                >
                  Contact Support
                </Link>
                <Link
                  href="/"
                  className={buttonVariants({
                    variant: "primary",
                    className: "w-full sm:w-auto text-xs",
                  })}
                >
                  Return to Showcase
                </Link>
              </div>
            </>
          )}

          {/* Status: Suspended or Deactivated */}
          {(status === "suspended" || status === "deactivated") && (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
                  Account {status === "suspended" ? "Suspended" : "Deactivated"}
                </span>
                <h1 className="text-2xl font-bold text-[#102124]">
                  Partner Portal Access Paused
                </h1>
                <p className="text-sm text-[#526267] leading-relaxed">
                  Your Solution Partner account is currently {status}. Please reach out to platform support for assistance or reactivation.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/my-support/new"
                  className={buttonVariants({
                    variant: "primary",
                    className: "w-full text-xs",
                  })}
                >
                  Contact Support
                </Link>
              </div>
            </>
          )}

          {/* Status: Unauthenticated or Not Applied (with Interactive Email Search) */}
          {(status === "unauthenticated" || status === "not_applied") && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#F3F7F7] text-[#155761] border border-[#D9E2E4] flex items-center justify-center mx-auto shadow-xs">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-[#102124]">
                  Partner Application Status
                </h1>
                <p className="text-sm text-[#526267] leading-relaxed">
                  {status === "not_applied" && effectiveEmail
                    ? `No registered partner application was found for "${effectiveEmail}". Check another email or submit a new partner application.`
                    : "Enter your registered email address below to look up your live Solution Partner application status."}
                </p>
              </div>

              {/* Interactive Email Lookup Form */}
              <form action="/partner/status" method="GET" className="space-y-3 pt-2">
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <Input
                    type="email"
                    name="email"
                    defaultValue={effectiveEmail}
                    placeholder="Enter your registered application email"
                    className="pl-9 text-sm"
                    required
                  />
                </div>
                <Button type="submit" variant="primary" className="w-full font-bold shadow-xs gap-2">
                  <Search className="w-4 h-4" />
                  <span>Check Application Status</span>
                </Button>
              </form>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-[#D9E2E4]">
                <Link
                  href="/partner-registration"
                  className={buttonVariants({
                    variant: "outline",
                    className: "w-full sm:w-auto text-xs font-semibold",
                  })}
                >
                  Apply as Solution Partner
                </Link>
                <Link
                  href="/login"
                  className={buttonVariants({
                    variant: "ghost",
                    className: "w-full sm:w-auto text-xs text-[#526267]",
                  })}
                >
                  Sign In
                </Link>
              </div>
            </>
          )}

          {/* Quick email lookup for any status */}
          {status !== "unauthenticated" && status !== "not_applied" && (
            <div className="pt-4 border-t border-[#D9E2E4] text-xs text-[#526267]">
              <span>Checking a different account? </span>
              <Link href="/partner/status" className="font-semibold text-[#155761] hover:underline">
                Look up by email
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
