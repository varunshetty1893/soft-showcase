// app/(customer)/profile/page.tsx
// Customer profile settings page.
// Source of truth: docs/07-page-map.md & docs/36-development-roadmap.md

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { getCustomerProfile } from "@/lib/db/queries/customer";
import { ProfileEditForm } from "@/components/customer/ProfileEditForm";

export const metadata: Metadata = {
  title: "Profile Settings — Soft Showcase",
  description: "Manage your Soft Showcase account profile and preferences.",
};

export default async function CustomerProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await getCustomerProfile(session.user.id);
  if (!user) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight text-[#102124]">
          Account Settings
        </h2>
        <p className="text-sm text-[#526267] mt-1">
          Review and update your profile information.
        </p>
      </div>

      <ProfileEditForm user={user} />
    </div>
  );
}
