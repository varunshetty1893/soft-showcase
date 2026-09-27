// app/admin/providers/new/page.tsx
// Admin page for creating a new project provider.
// Source of truth: docs/21-provider-management.md & docs/08-page-specifications.md

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { ProviderForm } from "@/components/admin/ProviderForm";

export const metadata: Metadata = {
  title: "Add New Provider — Admin",
  robots: { index: false },
};

export default function NewProviderPage() {
  return (
    <div className="space-y-8">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="space-y-2 pb-6 border-b border-gray-200">
        <Link
          href="/admin/providers"
          className="text-xs font-semibold text-gray-500 hover:text-indigo-600 inline-flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Providers
        </Link>
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-indigo-600" />
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            Add New Project Provider
          </h1>
        </div>
        <p className="text-xs text-gray-500">
          Create an independent developer or partner profile for project assignment and lead routing.
        </p>
      </div>

      <ProviderForm mode="create" />
    </div>
  );
}
