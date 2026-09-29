// app/partner/status/page.tsx
// Displays the current Solution Partner application status for the user.

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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Partner Application Status — ${APP_NAME}`,
  robots: { index: false },
};

interface PartnerStatusPageProps {
  searchParams?: Promise<{ email?: string; submitted?: string }>;
}

export default async function PartnerStatusPage({ searchParams }: PartnerStatusPageProps) {
  const session = await auth();
  const params = await searchParams;
  const lookupEmail = params?.email?.trim().toLowerCase();

  let partner = null;
  if (lookupEmail) {
    partner = await db.projectProvider.findFirst({
      where: {
        email: lookupEmail,
      },
    });
  }

  if (!partner && session?.user) {
    partner = await db.projectProvider.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || "" },
        ],
      },
    });
  }

  const status =
    partner?.applicationStatus ||
    (session?.user || lookupEmail ? "not_applied" : "unauthenticated");

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
          {/* Status: Pending Review */}
          {status === "pending" && (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
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
                  Your Solution Partner application has been submitted and is currently under review by our platform administration team.
                </p>
              </div>
              <div className="bg-[#F8FAFA] rounded-2xl p-4 border border-[#D9E2E4] text-xs text-[#526267] text-left space-y-2">
                <p className="font-semibold text-[#102124]">Review Details:</p>
                <p>• Partner Profile: <strong>{partner?.displayName}</strong></p>
                <p>• Contact Email: <strong>{partner?.email}</strong></p>
                <p>• Evaluation timeframe: Typically 24–48 business hours.</p>
                <p>• You will be granted full access to the Partner Portal immediately upon approval.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/support" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full gap-1.5 text-xs">
                    <Headphones className="w-3.5 h-3.5" />
                    Contact Support
                  </Button>
                </Link>
                <Link href="/" className="w-full sm:w-auto">
                  <Button variant="primary" className="w-full text-xs">
                    Explore Showcase
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Status: Approved */}
          {status === "approved" && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#DDF4EC] text-[#2F7D78] flex items-center justify-center mx-auto">
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
                  Your Solution Partner account has been approved. You now have full access to your Partner Portal, solutions management, and transaction records.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/partner/dashboard">
                  <Button variant="primary" size="lg" className="w-full gap-2 font-bold shadow-md cursor-pointer">
                    <span>Enter Partner Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Status: Rejected */}
          {status === "rejected" && (
            <>
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
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
                  Your Solution Partner application was not approved at this time.
                </p>
                {partner?.rejectionReason && (
                  <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 text-left">
                    <strong>Note:</strong> {partner.rejectionReason}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link href="/support" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full text-xs">
                    Contact Support
                  </Button>
                </Link>
                <Link href="/" className="w-full sm:w-auto">
                  <Button variant="primary" className="w-full text-xs">
                    Return to Showcase
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Status: Suspended or Deactivated */}
          {(status === "suspended" || status === "deactivated") && (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
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
                  Your Solution Partner account is currently {status}. Please reach out to administrative support for assistance or reactivation.
                </p>
              </div>
              <div className="pt-2">
                <Link href="/support">
                  <Button variant="primary" className="w-full text-xs">
                    Contact Support
                  </Button>
                </Link>
              </div>
            </>
          )}

          {/* Status: Unauthenticated or Not Applied */}
          {(status === "unauthenticated" || status === "not_applied") && (
            <>
              <div className="w-16 h-16 rounded-full bg-[#F3F7F7] text-[#155761] border border-[#D9E2E4] flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-[#102124]">
                  Solution Partner Status
                </h1>
                <p className="text-sm text-[#526267] leading-relaxed">
                  {status === "unauthenticated"
                    ? "Please sign in with your account credentials to view your Solution Partner application status."
                    : "You do not have an active Solution Partner application on file."}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {status === "unauthenticated" ? (
                  <Link href="/login?callbackUrl=/partner/status" className="w-full sm:w-auto">
                    <Button variant="primary" className="w-full">
                      Sign In to Check Status
                    </Button>
                  </Link>
                ) : (
                  <Link href="/partner-registration" className="w-full sm:w-auto">
                    <Button variant="primary" className="w-full">
                      Apply as Solution Partner
                    </Button>
                  </Link>
                )}
                <Link href="/" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full">
                    Back to Showcase
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
