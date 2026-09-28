// app/partner/layout.tsx
// Authenticated shell for the Solution Partner Portal.
// Strict server-side authorization: only approved partners and platform admins are permitted.

import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { PartnerSidebar } from "@/components/partner/PartnerSidebar";
import { PartnerHeader } from "@/components/partner/PartnerHeader";
import { APP_NAME } from "@/config/constants";

export const metadata = {
  title: `Partner Portal — ${APP_NAME}`,
  robots: { index: false, follow: false },
};

export default async function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/partner");
  }

  // Find partner profile associated with this user
  let partner = null;
  try {
    partner = await db.projectProvider.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || "" },
        ],
      },
    });
  } catch (err) {
    console.warn("Error finding partner profile:", err);
  }

  // Admins are always authorized to enter Partner Portal
  const isAdmin = session.user.isAdmin;

  if (!partner && !isAdmin) {
    redirect("/become-a-partner");
  }

  // If partner application is not approved (and not admin), redirect to status page
  if (partner && partner.applicationStatus !== "approved" && !isAdmin) {
    redirect("/partner/status");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFA] text-[#102124] flex flex-col">
      {/* Top Bar for Partner Portal */}
      <PartnerHeader
        user={session.user}
        partner={partner}
      />

      <div className="flex-1 flex w-full">
        {/* Partner Navigation Sidebar */}
        <PartnerSidebar partner={partner} />

        {/* Main Partner Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
