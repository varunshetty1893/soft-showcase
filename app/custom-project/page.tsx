// app/custom-project/page.tsx
// Public custom project request page.
// Source of truth: docs/26-custom-project-system.md & docs/08-page-specifications.md

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getCustomerProfile } from "@/lib/db/queries/customer";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CustomProjectForm } from "@/components/custom-project/CustomProjectForm";
import { Sparkles, ShieldCheck, Clock, Users } from "lucide-react";

import { APP_NAME, APP_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: "Request Custom Software — Soft Showcase",
  description:
    "Need a tailored web app, mobile app, or backend system? Submit your custom software project specifications directly to the Soft Showcase team.",
  alternates: {
    canonical: `${APP_URL}/custom-project`,
  },
  openGraph: {
    title: `Request Custom Software — ${APP_NAME}`,
    description:
      "Need a tailored web app, mobile app, or backend system? Submit your custom software project specifications directly to the Soft Showcase team.",
    url: `${APP_URL}/custom-project`,
    siteName: APP_NAME,
    type: "website",
    images: [
      {
        url: `${APP_URL}/logo.png`,
        width: 800,
        height: 600,
        alt: `${APP_NAME} Custom Request`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Request Custom Software — ${APP_NAME}`,
    description:
      "Need a tailored web app, mobile app, or backend system? Submit your custom software project specifications directly to the Soft Showcase team.",
    images: [`${APP_URL}/logo.png`],
  },
};

export default async function CustomProjectPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/custom-project");
  }

  const profile = await getCustomerProfile(session.user.id).catch(() => null);
  const initialContact = {
    name: profile?.name || session.user.name || "",
    email: profile?.contactEmail || profile?.email || session.user.email || "",
    whatsapp: profile?.whatsapp || "",
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFA] text-[#102124]">
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3F7F7] border border-[#D9E2E4] text-xs font-semibold text-[#155761] mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#2F7D78]" />
              <span>Bespoke Engineering</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#102124]">
              Request a Custom Software Project
            </h1>
            <p className="mt-3 text-base text-[#526267] max-w-xl mx-auto leading-relaxed">
              Have unique requirements or need a tailored architecture? Tell us what you
              want built and our engineering architects will review your scope.
            </p>
          </div>

          {/* Value Props Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="bg-white p-4 rounded-xl border border-[#D9E2E4] flex items-center gap-3 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-[#155761] shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-[#102124] block">Verified Builders</span>
                <span className="text-[#526267]">Vetted developers only</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#D9E2E4] flex items-center gap-3 shadow-xs">
              <Clock className="w-5 h-5 text-[#2F7D78] shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-[#102124] block">24-48h Response</span>
                <span className="text-[#526267]">Rapid architectural review</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#D9E2E4] flex items-center gap-3 shadow-xs">
              <Users className="w-5 h-5 text-[#155761] shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-[#102124] block">Direct Collaboration</span>
                <span className="text-[#526267]">WhatsApp or email updates</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <CustomProjectForm initialContact={initialContact} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
