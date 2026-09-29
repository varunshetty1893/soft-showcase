// lib/db/queries/projects.ts
// Database query helpers for projects.
// These are server-side only — never import in client components.

import { cache } from "react";
import { db } from "@/lib/db/client";
import type { ProjectStatus } from "@prisma/client";
import { DEFAULT_PAGE_SIZE } from "@/config/constants";

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

  const skip = (page - 1) * pageSize;

  const where = {
    status: "PUBLISHED" as ProjectStatus,
    ...(featured !== undefined && { featured }),
    ...(categorySlug && { category: { slug: categorySlug } }),
    ...(technologySlug && {
      technologies: { some: { technology: { slug: technologySlug } } },
    }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { shortDescription: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      select: {
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
      },
    }),
    db.project.count({ where }),
  ]);

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
  const trimmed = slug.trim();
  return db.project.findFirst({
    where: {
      OR: [
        { slug: trimmed },
        { slug: { equals: trimmed, mode: "insensitive" } },
      ],
      status: "PUBLISHED",
    },
    include: {
      category: true,
      provider: true,
      images: { orderBy: { sortOrder: "asc" } },
      features: { orderBy: { sortOrder: "asc" } },
      specifications: { orderBy: { sortOrder: "asc" } },
      faqs: { orderBy: { sortOrder: "asc" } },
      technologies: {
        include: { technology: true },
      },
    },
  });
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
  return db.project.findMany({
    where: {
      categoryId,
      status: "PUBLISHED",
      id: { not: excludeProjectId },
    },
    take: limit,
    orderBy: { featured: "desc" },
    select: {
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
    },
  });
});

/**
 * Fetch all published project slugs — used for static generation.
 */
export async function getAllPublishedSlugs(): Promise<string[]> {
  try {
    const projects = await db.project.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true },
    });
    return projects.map((p) => p.slug);
  } catch (err) {
    console.warn("Could not query published slugs for static generation:", err);
    return [];
  }
}
