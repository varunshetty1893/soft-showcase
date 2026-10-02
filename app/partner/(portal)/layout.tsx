// app/partner/(portal)/layout.tsx
// Shell for the Solution Partner Portal.
// Always renders the PartnerHeader top bar, PartnerSidebar, and main content area.

import { PartnerSidebar } from "@/components/partner/PartnerSidebar";
import { PartnerHeader } from "@/components/partner/PartnerHeader";
import { ToastProvider } from "@/components/ui/toast";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
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
  const { user, partner, isDemoGuest } = await getEffectivePartnerContext();

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F8FAFA] text-[#102124] flex flex-col">
        {/* Top Bar for Partner Portal */}
        <PartnerHeader
          user={user}
          partner={partner}
          isDemoGuest={isDemoGuest}
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
    </ToastProvider>
  );
}
