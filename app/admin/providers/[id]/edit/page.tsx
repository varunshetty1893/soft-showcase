// app/admin/providers/[id]/edit/page.tsx
// Admin page for editing an existing project provider.
// Source of truth: docs/21-provider-management.md & docs/08-page-specifications.md

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, UserCheck } from "lucide-react";
import { ProviderForm } from "@/components/admin/ProviderForm";
import { getProviderById } from "@/lib/db/queries/providers";

export const metadata: Metadata = {
  title: "Edit Provider — Admin",
  robots: { index: false },
};

interface EditProviderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProviderPage({ params }: EditProviderPageProps) {
  const { id } = await params;

  let provider = null;
  try {
    provider = await getProviderById(id);
  } catch (error) {
    console.error("Failed to query provider for edit:", error);
  }

  if (!provider) {
    notFound();
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="space-y-2 pb-6 border-b border-gray-200">
        <Link
          href="/admin/providers"
          className="text-xs font-semibold text-gray-500 hover:text-[#155761] inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Providers
        </Link>
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-[#155761]" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            Edit Provider: {provider.displayName}
          </h1>
        </div>
        <p className="text-xs text-gray-500">
          Modify contact details, consent flags, or communication channels.
        </p>
      </div>

      <ProviderForm
        mode="edit"
        initialData={{
          id: provider.id,
          displayName: provider.displayName,
          email: provider.email,
          whatsappNumber: provider.whatsappNumber,
          bio: provider.bio,
          avatarUrl: provider.avatarUrl,
          isActive: provider.isActive,
          showEmail: provider.showEmail,
          showWhatsapp: provider.showWhatsapp,
          providerConsentConfirmed: provider.providerConsentConfirmed,
        }}
      />
    </div>
  );
}
