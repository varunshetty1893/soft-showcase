// app/projects/[slug]/page.tsx
// Project Detail page for Soft Showcase.
// Source of truth: docs/08-page-specifications.md & docs/36-development-roadmap.md

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PriceBadge } from "@/components/projects/PriceBadge";
import { TechBadge } from "@/components/projects/TechBadge";
import { ProjectGallery } from "@/components/projects/ProjectGallery";
import { ProjectFeatures } from "@/components/projects/ProjectFeatures";
import { ProjectSpecs } from "@/components/projects/ProjectSpecs";
import { ProjectFAQ } from "@/components/projects/ProjectFAQ";
import { ProviderCard } from "@/components/providers/ProviderCard";
import { RelatedProjects } from "@/components/projects/RelatedProjects";
import { ProjectCardData } from "@/components/projects/ProjectCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getProjectBySlug,
  getRelatedProjects,
  getAllPublishedSlugs,
} from "@/lib/db/queries/projects";
import { APP_NAME, APP_URL } from "@/config/constants";
import { ChevronRight, ExternalLink, ShieldCheck } from "lucide-react";
import { formatDate } from "@/lib/utils/format";

export const revalidate = 3600; // 1 hour

interface ProjectDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllPublishedSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const project = await getProjectBySlug(slug);
    if (!project) return { title: "Project Not Found" };

    const primaryImage = project.images.find((i) => i.isPrimary) || project.images[0];

    return {
      title: `${project.title} — ${APP_NAME}`,
      description: project.shortDescription,
      alternates: {
        canonical: `${APP_URL}/projects/${slug}`,
      },
      openGraph: {
        title: `${project.title} | ${APP_NAME}`,
        description: project.shortDescription,
        url: `${APP_URL}/projects/${slug}`,
        siteName: APP_NAME,
        images: primaryImage ? [{ url: primaryImage.url, alt: project.title }] : undefined,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `${project.title} — ${APP_NAME}`,
        description: project.shortDescription,
        images: primaryImage ? [primaryImage.url] : undefined,
      },
    };
  } catch {
    return { title: `Software Project — ${APP_NAME}` };
  }
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params;

  let project = null;
  try {
    project = await getProjectBySlug(slug);
  } catch (err) {
    console.error("Failed to query project by slug:", err);
  }

  if (!project) {
    notFound();
  }

  let relatedProjects: ProjectCardData[] = [];
  try {
    relatedProjects = await getRelatedProjects(project.categoryId, project.id, 3);
  } catch (err) {
    console.warn("Could not load related projects:", err);
  }

  const primaryImage = project.images.find((i) => i.isPrimary) || project.images[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.title,
    description: project.shortDescription,
    applicationCategory: project.category?.name || "WebApplication",
    operatingSystem: "Web",
    image: primaryImage?.url,
    offers: {
      "@type": "Offer",
      price: project.price ? String(project.price) : "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    author: {
      "@type": "Organization",
      name: project.provider?.displayName || APP_NAME,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* ── Breadcrumb Navigation ──────────────────────────────────── */}
          <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6 flex-wrap">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <Link href="/projects" className="hover:text-gray-900 transition-colors">
              Projects
            </Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <Link
              href={`/projects?category=${project.category.slug}`}
              className="hover:text-gray-900 transition-colors"
            >
              {project.category.name}
            </Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-gray-900 font-medium truncate max-w-[200px]">
              {project.title}
            </span>
          </nav>

          {/* ── Project Header ─────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-gray-200">
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Badge variant="default" className="text-xs font-semibold">
                  {project.category.name}
                </Badge>
                <PriceBadge
                  priceMode={project.priceMode}
                  price={project.price ? project.price.toString() : null}
                />
                {project.featured && (
                  <Badge variant="warning" className="text-xs font-bold">
                    Featured Project
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950">
                {project.title}
              </h1>

              <p className="text-base text-gray-600 max-w-3xl leading-relaxed">
                {project.shortDescription}
              </p>
            </div>

            {/* External Links (Live Demo, GitHub) */}
            <div className="flex items-center gap-3 shrink-0">
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="gap-1.5 shadow-xs">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Live Preview
                  </Button>
                </a>
              )}
            </div>
          </div>

          {/* ── Main Content Grid ──────────────────────────────────────── */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left 2 Columns: Gallery, Overview, Features, Specs, FAQ */}
            <div className="lg:col-span-2 space-y-8">
              {/* Screenshot Gallery */}
              <ProjectGallery images={project.images} projectTitle={project.title} />

              {/* Technologies Pill Row */}
              {project.technologies.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                    Technology Stack
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((t) => (
                      <TechBadge key={t.technology.id} name={t.technology.name} />
                    ))}
                  </div>
                </div>
              )}

              {/* Full Description / Overview */}
              {project.fullDescription && (
                <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Project Overview</h2>
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                    {project.fullDescription}
                  </div>
                </section>
              )}

              {/* Key Features */}
              <ProjectFeatures features={project.features} />

              {/* Technical Specifications */}
              <ProjectSpecs specifications={project.specifications} />

              {/* FAQ Section */}
              <ProjectFAQ faqs={project.faqs} />
            </div>

            {/* Right Column: Provider Card & Project Summary */}
            <div className="space-y-6 lg:sticky lg:top-24">
              <ProviderCard
                provider={project.provider}
                projectTitle={project.title}
                projectId={project.id}
                projectSlug={project.slug}
              />

              {/* Meta details card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4 text-xs">
                <h4 className="font-bold text-gray-900 text-sm">Project Details</h4>
                <div className="space-y-3 text-gray-600">
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-gray-500">Project Type</span>
                    <span className="font-medium text-gray-900">{project.projectType}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-gray-100">
                    <span className="text-gray-500">Published Date</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(project.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">Direct Contact</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Available
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Related Projects ───────────────────────────────────────── */}
          <RelatedProjects projects={relatedProjects} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
