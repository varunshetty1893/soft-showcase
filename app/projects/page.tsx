// app/projects/page.tsx
// Project Catalog page.
// Source of truth: docs/08-page-specifications.md & docs/36-development-roadmap.md

import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { ProjectSearch } from "@/components/projects/ProjectSearch";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import { Pagination } from "@/components/projects/Pagination";
import { getPublishedProjects } from "@/lib/db/queries/projects";
import { getActiveCategories } from "@/lib/db/queries/categories";
import { DEFAULT_CATEGORIES } from "@/config/categories";

import { APP_NAME, APP_URL } from "@/config/constants";
import { ProjectCardData } from "@/components/projects/ProjectCard";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Browse Software Projects — Soft Showcase",
  description:
    "Explore our directory of production-grade software applications, mobile apps, and developer tools. Connect with verified builders directly via WhatsApp or email.",
  alternates: {
    canonical: `${APP_URL}/projects`,
  },
  openGraph: {
    title: `Browse Software Projects — ${APP_NAME}`,
    description:
      "Explore our directory of production-grade software applications, mobile apps, and developer tools. Connect with verified builders directly via WhatsApp or email.",
    url: `${APP_URL}/projects`,
    siteName: APP_NAME,
    type: "website",
    images: [
      {
        url: `${APP_URL}/logo.png`,
        width: 800,
        height: 600,
        alt: `${APP_NAME} Catalog`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Browse Software Projects — ${APP_NAME}`,
    description:
      "Explore our directory of production-grade software applications, mobile apps, and developer tools. Connect with verified builders directly via WhatsApp or email.",
    images: [`${APP_URL}/logo.png`],
  },
};

interface ProjectsPageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    tech?: string;
    q?: string;
  }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams;

  const currentPage = parseInt(params.page || "1", 10) || 1;
  // Keep previously shared `ai-ml` links working while using one canonical
  // category slug everywhere else.
  const categorySlug = params.category === "ai-ml" ? "ai-machine-learning" : params.category;
  const techSlug = params.tech;
  const search = params.q;

  let projectsData: {
    projects: ProjectCardData[];
    total: number;
    totalPages: number;
    currentPage: number;
  } = {
    projects: [],
    total: 0,
    totalPages: 0,
    currentPage,
  };

  let categories = DEFAULT_CATEGORIES.map((c, idx) => ({
    id: `cat-${idx}`,
    name: c.name,
    slug: c.slug,
  }));

  try {
    const [fetchedProjects, fetchedCategories] = await Promise.all([
      getPublishedProjects({
        page: currentPage,
        categorySlug,
        technologySlug: techSlug,
        search,
      }),
      getActiveCategories().catch(() => []),
    ]);

    projectsData = fetchedProjects;
    if (fetchedCategories && fetchedCategories.length > 0) {
      categories = fetchedCategories
        // `ai-ml` was a legacy duplicate of the canonical AI category.
        .filter((c) => c.slug !== "ai-ml")
        .map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
        }));
    }
  } catch (err) {
    console.warn("Could not query database for projects (DB may not be migrated yet):", err);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFA] text-[#102124]">
      <Navbar />

      <main className="flex-1 py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#D9E2E4]">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#102124]">
                Software Project Catalog
              </h1>
              <p className="mt-2 text-sm text-[#526267]">
                Showing {projectsData.total}{" "}
                {projectsData.total === 1 ? "project" : "projects"} available for deployment or customization.
              </p>
            </div>

            <ProjectSearch />
          </div>

          {/* Main Layout: Filters + Project Grid */}
          <div className="mt-8 flex flex-col lg:flex-row gap-8 items-start">
            <ProjectFilters categories={categories} />

            <div className="flex-1 min-w-0 w-full space-y-8">
              <ProjectGrid projects={projectsData.projects} />

              <Pagination
                currentPage={projectsData.currentPage}
                totalPages={projectsData.totalPages}
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
