// app/admin/profile/page.tsx
// Admin Profile & Password Management Page.

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { AdminProfileForm } from "@/components/admin/AdminProfileForm";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Profile & Password — Soft Showcase",
};

export default async function AdminProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/profile");
  }

  if (!session.user.isAdmin) {
    redirect("/");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isAdmin: true,
      createdAt: true,
      passwordHash: true,
    },
  });

  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#102124] flex items-center gap-2">
          <span>Administrator Account</span>
          <ShieldCheck className="w-5 h-5 text-[#2F7D78]" />
        </h1>
        <p className="text-xs text-[#526267] mt-1">
          Manage your administrator profile details and change or reset your login password.
        </p>
      </div>

      <AdminProfileForm
        user={{
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          hasPassword: Boolean(user.passwordHash),
        }}
      />
    </div>
  );
}
