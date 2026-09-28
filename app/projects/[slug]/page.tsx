// app/projects/[slug]/page.tsx
// Project Detail page for Soft Showcase.
// Source of truth: docs/08-page-specifications.md & docs/36-development-roadmap.md

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { PriceBadge } from "@/components/projects/PriceBadge";
import { TechBadge } from "@/components/projects/TechBadge";
import { ProjectGallery } from "@/components/projects/ProjectGallery";
import { ProjectFeatures } from "@/components/projects/ProjectFeatures";
import { ProjectSpecs } from "@/components/projects/ProjectSpecs";
import { ProjectFAQ } from "@/components/projects/ProjectFAQ";
import { ProviderCard } from "@/components/providers/ProviderCard";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
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
import { ChevronRight, ExternalLink, ShieldCheck, CheckCircle2, Lock } from "lucide-react";
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

  // Enforce authentication: No user can access any project without logging in
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/projects/${slug}`)}`);
  }

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
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
    author: {
      "@type": "Organization",
      name: project.provider?.displayName || APP_NAME,
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFA] text-[#102124]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* ── Breadcrumb Navigation ──────────────────────────────────── */}
          <nav className="flex items-center gap-2 text-xs text-[#526267] mb-6 flex-wrap">
            <Link href="/" className="hover:text-[#155761] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3 text-[#526267]" />
            <Link href="/projects" className="hover:text-[#155761] transition-colors">
              Projects
            </Link>
            <ChevronRight className="w-3 h-3 text-[#526267]" />
            <Link
              href={`/projects?category=${project.category.slug}`}
              className="hover:text-[#155761] transition-colors"
            >
              {project.category.name}
            </Link>
            <ChevronRight className="w-3 h-3 text-[#526267]" />
            <span className="text-[#102124] font-medium truncate max-w-[200px]">
              {project.title}
            </span>
          </nav>

          {/* ── Project Header ─────────────────────────────────────────── */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-8 border-b border-[#D9E2E4]">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 flex-wrap">
                <Badge variant="default" className="text-xs font-semibold">
                  {project.category.name}
                </Badge>
                {project.featured && (
                  <Badge variant="mint" className="text-xs font-bold">
                    Featured Project
                  </Badge>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#102124]">
                {project.title}
              </h1>

              <p className="text-base text-[#526267] max-w-3xl leading-relaxed">
                {project.shortDescription}
              </p>

              {/* Amazon / Flipkart Style Price Header */}
              <div className="pt-2">
                <PriceBadge
                  priceMode={project.priceMode}
                  price={project.price ? project.price.toString() : null}
                  variant="detail"
                  showTaxNotice={true}
                />
              </div>
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
                <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#526267] mb-3">
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
                <section className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs">
                  <h2 className="text-xl font-bold text-[#102124] mb-4">Project Overview</h2>
                  <div className="prose prose-sm max-w-none text-[#526267] leading-relaxed whitespace-pre-line">
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
              {/* Amazon / Flipkart Style Order Box */}
              <div className="bg-white rounded-2xl border border-[#D9E2E4] p-5 shadow-xs space-y-3.5">
                <div className="border-b border-[#F3F7F7] pb-3">
                  <PriceBadge
                    priceMode={project.priceMode}
                    price={project.price ? project.price.toString() : null}
                    variant="card"
                    showTaxNotice={true}
                  />
                </div>

                <div className="space-y-2 text-xs text-[#526267]">
                  <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>In Stock • Direct Builder Handover</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#155761] shrink-0" />
                    <span>Verified Maker: <strong className="text-[#102124] ml-0.5">{project.provider.displayName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#526267] shrink-0" />
                    <span>Direct WhatsApp &amp; Authenticated Email</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#F3F7F7]">
                  <AddToCartButton
                    project={{
                      id: project.id,
                      title: project.title,
                      slug: project.slug,
                      shortDescription: project.shortDescription,
                      priceMode: project.priceMode,
                      price: project.price ? project.price.toString() : null,
                      imageUrl: project.images?.[0]?.url || null,
                      providerName: project.provider.displayName,
                      providerWhatsapp: project.provider.whatsappNumber,
                      providerEmail: project.provider.email,
                      categoryName: project.category.name,
                    }}
                  />
                </div>
              </div>

              <ProviderCard
                provider={project.provider}
                projectTitle={project.title}
                projectId={project.id}
                projectSlug={project.slug}
              />

              {/* Meta details card */}
              <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 shadow-xs space-y-4 text-xs">
                <h4 className="font-bold text-[#102124] text-sm">Project Details</h4>
                <div className="space-y-3 text-[#526267]">
                  <div className="flex justify-between items-center py-1 border-b border-[#F3F7F7]">
                    <span className="text-[#526267]">Project Type</span>
                    <span className="font-medium text-[#102124]">{project.projectType}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#F3F7F7]">
                    <span className="text-[#526267]">Published Date</span>
                    <span className="font-medium text-[#102124]">
                      {formatDate(project.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[#526267]">Direct Contact</span>
                    <span className="font-semibold text-[#2F7D78] flex items-center gap-1">
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
