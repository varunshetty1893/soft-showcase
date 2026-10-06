// app/admin/projects/[id]/edit/page.tsx
// Admin: edit an existing project.
// Fetches project data server-side and passes to the client form.

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProjectForm from "@/components/admin/ProjectForm";
import { getAdminProjectById } from "@/lib/db/queries/admin-projects";
import { getCurrentUser } from "@/lib/auth/session";
import { getProjectOwnership } from "@/lib/auth/project-permissions";
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

  const [project, currentUser] = await Promise.all([
    getAdminProjectById(id).catch(() => null),
    getCurrentUser().catch(() => null),
  ]);

  if (!project) notFound();

  const ownership = getProjectOwnership(project, currentUser);

  // Transform Prisma model → ProjectForm initialData shape
  const initialData = {
    title: project.title,
    slug: project.slug,
    shortDescription: project.shortDescription,
    fullDescription: project.fullDescription,
    status: project.status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    featured: project.featured,
    featuredOrder: (project as any).featuredOrder ?? 0,
    moderationNote: (project as any).moderationNote ?? "",
    moderatedAt: (project as any).moderatedAt
      ? new Date((project as any).moderatedAt).toISOString()
      : null,
    priceMode: project.priceMode as "CONTACT" | "FIXED" | "STARTING_FROM" | "FREE",
    price: project.price?.toString() ?? "",
    originalPrice: project.originalPrice?.toString() ?? "",
    priceQualifier: (((project as any).priceQualifier as string) ?? "NONE") as
      | "NONE"
      | "STARTING_FROM"
      | "NEGOTIABLE",
    dealType: (((project as any).dealType as string) ?? "NONE") as
      | "NONE"
      | "LIMITED_DEAL"
      | "LAUNCH_OFFER"
      | "FESTIVE_SALE"
      | "EARLY_BIRD"
      | "CLEARANCE"
      | "CUSTOM",
    dealLabel: ((project as any).dealLabel as string) ?? "",
    dealStartsAt: (project as any).dealStartsAt
      ? new Date((project as any).dealStartsAt).toISOString()
      : "",
    dealEndsAt: (project as any).dealEndsAt
      ? new Date((project as any).dealEndsAt).toISOString()
      : "",
    demoUrl: project.demoUrl ?? "",
    projectType: project.projectType ?? "",
    categoryId: project.categoryId,
    categoryName: project.category?.name ?? "",
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
    technologyNames: project.technologies
      .map((t: any) => t.technology?.name)
      .filter(Boolean) as string[],
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
      <div className="flex items-center justify-between pb-4 border-b border-[#D9E2E4]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/projects"
            className="p-2 rounded-xl bg-white border border-[#D9E2E4] hover:bg-[#F3F7F7] text-[#526267] transition-colors shrink-0"
            aria-label="Back to Projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#102124]">
              Edit Project: {project.title}
            </h1>
            <p className="text-xs text-[#526267] mt-1 font-mono">/projects/{project.slug}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <ProjectForm
        initialData={initialData}
        projectId={project.id}
        initialImages={initialImages}
        isPartnerOwned={ownership === "partner_owned"}
        partnerDisplayName={project.provider?.displayName}
      />
    </div>
  );
}
