// app/partner/solutions/[id]/edit/page.tsx
// Edit software solution.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { ArrowLeft, Layers } from "lucide-react";
import { PartnerSolutionForm } from "@/components/partner/PartnerSolutionForm";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Edit Solution — ${APP_NAME}`,
  robots: { index: false },
};

export default async function EditPartnerSolutionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) return null;

  const { id } = await params;

  const [project, categories, technologies] = await Promise.all([
    db.project.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        features: { orderBy: { sortOrder: "asc" } },
        specifications: { orderBy: { sortOrder: "asc" } },
        faqs: { orderBy: { sortOrder: "asc" } },
        technologies: true,
      },
    }),
    db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.technology.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-[#D9E2E4]">
        <div className="flex items-center gap-3">
          <Link
            href="/partner/solutions"
            className="p-2 rounded-xl bg-white border border-[#D9E2E4] hover:bg-[#F3F7F7] text-[#526267] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#102124]">Edit Solution: {project.title}</h1>
            <p className="text-xs text-[#526267]">
              Update description, features, pricing, or catalog visibility.
            </p>
          </div>
        </div>
      </div>

      <PartnerSolutionForm
        initialData={project}
        categories={categories}
        technologies={technologies}
        isEditing={true}
      />
    </div>
  );
}
