// app/partner/(portal)/solutions/[id]/edit/page.tsx
// Edit software solution.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { getEffectivePartnerContext } from "@/lib/auth/partner-auth";
import { ArrowLeft } from "lucide-react";
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
  await getEffectivePartnerContext();

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
        initialData={{
          id: project.id,
          title: project.title,
          slug: project.slug,
          shortDescription: project.shortDescription,
          fullDescription: project.fullDescription || "",
          categoryId: project.categoryId,
          status: project.status,
          priceMode: project.priceMode,
          price: project.price ? String(project.price) : "",
          projectType: project.projectType || "",
          demoUrl: project.demoUrl || "",
          whatsIncluded: project.whatsIncluded || [],
          technologies: project.technologies?.map((t: any) => t.technologyId || t.id) || [],
          features: project.features?.map((f: any) => f.feature || f.title) || [],
          specifications: project.specifications || [],
          faqs: project.faqs || [],
          images: project.images || [],
        }}
        categories={categories}
        technologies={technologies}
        isEditing={true}
      />
    </div>
  );
}
