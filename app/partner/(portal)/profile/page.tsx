// app/partner/(portal)/profile/page.tsx
// Solution Partner studio settings and profile editor.

import type { Metadata } from "next";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import { Settings } from "lucide-react";
import { PartnerProfileForm } from "@/components/partner/PartnerProfileForm";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Studio Settings — ${APP_NAME}`,
  robots: { index: false },
};

export default async function PartnerProfilePage() {
  const { partner } = await getEffectivePartnerContext();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#D9E2E4]">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#155761]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#102124]">
              Studio &amp; Partner Settings
            </h1>
          </div>
          <p className="mt-1 text-xs text-[#526267]">
            Update your public software creator profile, expertise tags, WhatsApp contact preferences, and portfolio links.
          </p>
        </div>
      </div>

      <PartnerProfileForm partner={partner} />
    </div>
  );
}
