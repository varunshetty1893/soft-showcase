// app/admin/projects/[id]/edit/page.tsx
// Admin: edit an existing project.
// Fetches project data server-side and passes to the client form.

import { notFound } from "next/navigation";
import ProjectForm from "@/components/admin/ProjectForm";
import { getAdminProjectById } from "@/lib/db/queries/admin-projects";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getAdminProjectById(id).catch(() => null);
  return {
    title: project ? `Edit: ${project.title} — Admin | Soft Showcase` : "Edit Project — Admin",
  };
}

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;

  let project;
  try {
    project = await getAdminProjectById(id);
  } catch {
    project = null;
  }

  if (!project) notFound();

  // Transform Prisma model → ProjectForm initialData shape
  const initialData = {
    title: project.title,
    slug: project.slug,
    shortDescription: project.shortDescription,
    fullDescription: project.fullDescription,
    status: project.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    featured: project.featured,
    priceMode: project.priceMode as "CONTACT" | "FIXED" | "STARTING_FROM" | "FREE",
    price: project.price?.toString() ?? "",
    demoUrl: project.demoUrl ?? "",
    projectType: project.projectType ?? "",
    categoryId: project.categoryId,
    providerId: project.providerId,
    whatsIncluded: project.whatsIncluded,
    features: project.features.map((f) => ({
      id: f.id,
      feature: f.feature,
    })),
    specifications: project.specifications.map((s) => ({
      id: s.id,
      key: s.key,
      value: s.value,
    })),
    faqs: project.faqs.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
    })),
    technologyIds: project.technologies.map((t) => t.technologyId),
  };

  // Transform images → ProjectImageItem shape
  const initialImages = project.images.map((img) => ({
    id: img.id,
    url: img.url,
    storageKey: img.storageKey,
    altText: img.altText,
    isPrimary: img.isPrimary,
    sortOrder: img.sortOrder,
  }));

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Edit Project</h1>
        <p className="text-sm text-gray-400 mt-1 font-mono">{project.slug}</p>
      </div>

      {/* Form */}
      <ProjectForm initialData={initialData} projectId={project.id} initialImages={initialImages} />
    </div>
  );
}
