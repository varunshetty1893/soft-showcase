// app/custom-project/page.tsx
// Public custom project request page.
// Source of truth: docs/26-custom-project-system.md & docs/08-page-specifications.md

import type { Metadata } from "next";
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
  },
};

export default function CustomProjectPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <Navbar />

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700 mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bespoke Engineering</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950">
              Request a Custom Software Project
            </h1>
            <p className="mt-3 text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
              Have unique requirements or need a tailored architecture? Tell us what you
              want built and our engineering architects will review your scope.
            </p>
          </div>

          {/* Value Props Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <div className="bg-white p-4 rounded-xl border border-gray-200/80 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-gray-900 block">Verified Builders</span>
                <span className="text-gray-500">Vetted developers only</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200/80 flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-gray-900 block">24-48h Response</span>
                <span className="text-gray-500">Rapid architectural review</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200/80 flex items-center gap-3">
              <Users className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-gray-900 block">Direct Collaboration</span>
                <span className="text-gray-500">WhatsApp or email updates</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <CustomProjectForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}
