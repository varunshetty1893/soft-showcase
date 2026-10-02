// lib/db/queries/projects.ts
// Database query helpers for projects.
// These are server-side only — never import in client components.

import { cache } from "react";
import { db, ensureAdditiveSchema } from "@/lib/db/client";
import type { ProjectStatus } from "@prisma/client";
import { DEFAULT_PAGE_SIZE } from "@/config/constants";
import { publicProviderWhere, publicProjectWhere } from "./public-filters";

export { publicProviderWhere, publicProjectWhere };

function isMissingColumnError(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  const msg = String((err as { message?: string })?.message || "");
  return (
    code === "P2022" ||
    msg.includes("originalPrice") ||
    msg.includes("dealType") ||
    msg.includes("removedAt") ||
    msg.includes("does not exist")
  );
}

/**
 * Fetch published projects for the catalog page.
 * Supports filtering by category, technology, and search term.
 */
export async function getPublishedProjects(options: {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  technologySlug?: string;
  search?: string;
  featured?: boolean;
}) {
  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    categorySlug,
    technologySlug,
    search,
    featured,
  } = options;

  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL?.trim()) {
    return {
      projects: [],
      total: 0,
      totalPages: 0,
      currentPage: page,
    };
  }

  const skip = (page - 1) * pageSize;

  const where = publicProjectWhere({
    ...(featured !== undefined && { featured }),
    ...(categorySlug && { category: { slug: categorySlug } }),
    ...(technologySlug && {
      technologies: { some: { technology: { slug: technologySlug } } },
    }),
    ...(search && (() => {
      const cleanSearch = search.trim();
      const slugSearch = cleanSearch.toLowerCase().replace(/[^a-z0-9]+/g, "-");

      return {
        OR: [
          // Index-friendly prefix match on slug
          { slug: { startsWith: slugSearch } },
          // Title prefix match (utilizes B-Tree index)
          { title: { startsWith: cleanSearch, mode: "insensitive" as const } },
          // Insensitive title contains
          { title: { contains: cleanSearch, mode: "insensitive" as const } },
          // Technology name match
          {
            technologies: {
              some: {
                technology: {
                  name: { contains: cleanSearch, mode: "insensitive" as const },
                },
              },
            },
          },
          // Scoped short description fallback
          { shortDescription: { contains: cleanSearch, mode: "insensitive" as const } },
        ],
      };
    })()),
  });

  const baseSelect = {
    id: true,
    title: true,
    slug: true,
    shortDescription: true,
    status: true,
    featured: true,
    priceMode: true,
    price: true,
    projectType: true,
    createdAt: true,
    category: { select: { id: true, name: true, slug: true } },
    provider: {
      select: { id: true, displayName: true, avatarUrl: true },
    },
    images: {
      where: { isPrimary: true },
      take: 1,
      select: { url: true, altText: true },
    },
    technologies: {
      take: 3,
      include: { technology: { select: { id: true, name: true, slug: true } } },
    },
  } as const;

  const queryWithOriginalPrice = () =>
    Promise.all([
      db.project.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ featured: "desc" }, { featuredOrder: "asc" }, { createdAt: "desc" }],
        select: {
          ...baseSelect,
          originalPrice: true,
          priceQualifier: true,
          dealType: true,
          dealLabel: true,
          dealStartsAt: true,
          dealEndsAt: true,
        },
      }),
      db.project.count({ where }),
    ]);

  let result: Awaited<ReturnType<typeof queryWithOriginalPrice>>;

  await ensureAdditiveSchema();

  try {
    result = await queryWithOriginalPrice();
  } catch (err) {
    if (!isMissingColumnError(err)) throw err;
    await ensureAdditiveSchema();
    const [fallbackProjects, fallbackTotal] = await Promise.all([
      db.project.findMany({
        where: {
          status: "PUBLISHED" as ProjectStatus,
          provider: { isActive: true, applicationStatus: "approved" },
        },
        skip,
        take: pageSize,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        select: baseSelect,
      }),
      db.project.count({
        where: {
          status: "PUBLISHED" as ProjectStatus,
          provider: { isActive: true, applicationStatus: "approved" },
        },
      }),
    ]);
    result = [
      fallbackProjects.map((p) => ({
        ...p,
        originalPrice: null,
        priceQualifier: "NONE" as const,
        dealType: "NONE" as const,
        dealLabel: null,
        dealStartsAt: null,
        dealEndsAt: null,
      })),
      fallbackTotal,
    ];
  }

  const [projects, total] = result;

  return {
    projects,
    total,
    totalPages: Math.ceil(total / pageSize),
    currentPage: page,
  };
}

/**
 * Fetch a single published project by slug for the detail page.
 * Memoized with React cache() to deduplicate metadata and page queries.
 * Returns null if not found or not published.
 */
export const getProjectBySlug = cache(async (slug: string) => {
  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL?.trim()) {
    return null;
  }
  const trimmed = slug.trim();
  const whereClause = publicProjectWhere({
    OR: [
      { slug: trimmed },
      { slug: { equals: trimmed, mode: "insensitive" as const } },
    ],
  });

  const relationsSelect = {
    category: true,
    provider: {
      select: {
        id: true,
        displayName: true,
        email: true,
        whatsappNumber: true,
        bio: true,
        avatarUrl: true,
        location: true,
        portfolioUrl: true,
        githubUrl: true,
        linkedinUrl: true,
        showEmail: true,
        showWhatsapp: true,
        removedAt: true,
      },
    },
    images: { orderBy: { sortOrder: "asc" as const } },
    features: { orderBy: { sortOrder: "asc" as const } },
    specifications: { orderBy: { sortOrder: "asc" as const } },
    faqs: { orderBy: { sortOrder: "asc" as const } },
    technologies: {
      include: { technology: true },
    },
  };

  const queryFullProject = () =>
    db.project.findFirst({
      where: whereClause,
      include: relationsSelect,
    });

  let project: Awaited<ReturnType<typeof queryFullProject>>;
  await ensureAdditiveSchema();
  try {
    project = await queryFullProject();
  } catch (err) {
    if (!isMissingColumnError(err)) throw err;
    await ensureAdditiveSchema();
    const fallback = await db.project.findFirst({
      where: {
        OR: [
          { slug: trimmed },
          { slug: { equals: trimmed, mode: "insensitive" as const } },
        ],
        status: "PUBLISHED" as ProjectStatus,
        provider: { isActive: true, applicationStatus: "approved" },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        fullDescription: true,
        status: true,
        featured: true,
        priceMode: true,
        price: true,
        demoUrl: true,
        projectType: true,
        whatsIncluded: true,
        categoryId: true,
        providerId: true,
        createdAt: true,
        updatedAt: true,
        ...relationsSelect,
      },
    });
    project = fallback
      ? ({
          ...fallback,
          originalPrice: null,
          featuredOrder: 0,
          priceQualifier: "NONE",
          dealType: "NONE",
          dealLabel: null,
          dealStartsAt: null,
          dealEndsAt: null,
          moderationNote: null,
          moderatedAt: null,
          moderatedById: null,
        } as Awaited<ReturnType<typeof queryFullProject>>)
      : null;
  }

  if (!project || (project.provider as any)?.removedAt) return null;

  const hasConfiguredEmail =
    project.provider?.email !== undefined
      ? Boolean(project.provider?.email)
      : true;
  const hasConfiguredWhatsapp =
    project.provider?.whatsappNumber !== undefined
      ? Boolean(project.provider?.whatsappNumber)
      : true;

  const safeProvider = {
    ...project.provider,
    hasEmail: Boolean(project.provider?.showEmail && hasConfiguredEmail),
    hasWhatsapp: Boolean(project.provider?.showWhatsapp && hasConfiguredWhatsapp),
  };

  delete (safeProvider as any).email;
  delete (safeProvider as any).whatsappNumber;

  return {
    ...project,
    provider: safeProvider,
  };
});

/**
 * Fetch related projects in the same category (excluding the current project).
 * Memoized with React cache().
 */
export const getRelatedProjects = cache(async (
  categoryId: string,
  excludeProjectId: string,
  limit = 3
) => {
  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL?.trim()) {
    return [];
  }
  const whereClause = publicProjectWhere({
    categoryId,
    id: { not: excludeProjectId },
  });

  const baseSelect = {
    id: true,
    title: true,
    slug: true,
    shortDescription: true,
    priceMode: true,
    price: true,
    category: { select: { id: true, name: true, slug: true } },
    provider: { select: { id: true, displayName: true, avatarUrl: true } },
    images: {
      where: { isPrimary: true },
      take: 1,
      select: { url: true, altText: true },
    },
  } as const;

  await ensureAdditiveSchema();

  try {
    return await db.project.findMany({
      where: whereClause,
      take: limit,
      orderBy: { featured: "desc" },
      select: {
        ...baseSelect,
        originalPrice: true,
        priceQualifier: true,
        dealType: true,
        dealLabel: true,
        dealStartsAt: true,
        dealEndsAt: true,
      },
    });
  } catch (err) {
    if (!isMissingColumnError(err)) throw err;
    await ensureAdditiveSchema();
    const fallback = await db.project.findMany({
      where: {
        categoryId,
        status: "PUBLISHED" as ProjectStatus,
        id: { not: excludeProjectId },
        provider: { isActive: true, applicationStatus: "approved" },
      },
      take: limit,
      orderBy: { featured: "desc" },
      select: baseSelect,
    });
    return fallback.map((p) => ({
      ...p,
      originalPrice: null,
      priceQualifier: "NONE" as const,
      dealType: "NONE" as const,
      dealLabel: null,
      dealStartsAt: null,
      dealEndsAt: null,
    }));
  }
});

/**
 * Fetch all published project slugs — used for static generation and sitemap.
 */
export async function getAllPublishedSlugs(): Promise<string[]> {
  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL?.trim()) {
    return [];
  }
  try {
    await ensureAdditiveSchema();
    const projects = await db.project.findMany({
      where: publicProjectWhere(),
      select: { slug: true },
    });
    return projects.map((p) => p.slug);
  } catch {
    return [];
  }
}
