// app/custom-project/page.tsx
// Public custom project request page.
// Source of truth: docs/26-custom-project-system.md & docs/08-page-specifications.md

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getCustomerProfile, getCustomerRequests } from "@/lib/db/queries/customer";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CustomProjectView } from "@/components/custom-project/CustomProjectView";

import { APP_NAME, APP_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: `Custom Software Development — ${APP_NAME}`,
  description:
    "Need a tailored web app, mobile app, or backend system? Submit your custom software project specifications or track your active request scopes.",
  alternates: {
    canonical: `${APP_URL}/custom-project`,
  },
};

export default async function CustomProjectPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/custom-project");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const activeTab = resolvedParams?.tab === "requests" ? "requests" : "new";

  const [profile, rawRequests] = await Promise.all([
    getCustomerProfile(session.user.id).catch(() => null),
    getCustomerRequests(session.user.id).catch(() => []),
  ]);

  const initialContact = {
    name: profile?.name || session.user.name || "",
    email: profile?.contactEmail || profile?.email || session.user.email || "",
    whatsapp: profile?.whatsapp || "",
  };

  const serializedRequests = (rawRequests || []).map((req: any) => ({
    id: req.id,
    projectTitle: req.projectTitle,
    category: req.category,
    budget: req.budget,
    deadline: req.deadline,
    description: req.description,
    requiredFeatures: req.requiredFeatures,
    technologyPreferences: req.technologyPreferences,
    status: req.status,
    createdAt: req.createdAt instanceof Date ? req.createdAt.toISOString() : req.createdAt,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFA] text-[#102124]">
      <Navbar />

      <main className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <CustomProjectView
            initialContact={initialContact}
            requests={serializedRequests}
            initialTab={activeTab}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

