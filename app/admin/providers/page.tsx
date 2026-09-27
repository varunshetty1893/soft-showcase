// app/admin/providers/page.tsx
// Admin provider management list.
// Source of truth: docs/21-provider-management.md & docs/08-page-specifications.md

import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProviderTable, type ProviderTableRow } from "@/components/admin/ProviderTable";
import { getAllProviders } from "@/lib/db/queries/providers";

export const metadata: Metadata = {
  title: "Provider Management — Admin",
  robots: { index: false },
};

export default async function AdminProvidersPage() {
  let providers: ProviderTableRow[] = [];

  try {
    providers = await getAllProviders();
  } catch (error) {
    console.warn("Could not query providers from database:", error);
  }

  return (
    <div className="space-y-8">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">
              Project Providers
            </h1>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Manage developers and external creators who provide software projects.
          </p>
        </div>

        <Link href="/admin/providers/new">
          <Button size="sm" className="gap-2 shadow-xs">
            <Plus className="w-4 h-4" />
            Add New Provider
          </Button>
        </Link>
      </div>

      {/* ── Table Section ──────────────────────────────────────────────── */}
      <ProviderTable providers={providers} />
    </div>
  );
}
