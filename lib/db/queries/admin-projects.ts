// lib/db/queries/admin-projects.ts
// Admin-only database query helpers for project management.
// Server-side only — never import in client components.

import { db } from "@/lib/db/client";
import type { ProjectStatus } from "@prisma/client";

// ─── List ────────────────────────────────────────────────────────────────────

/**
 * Fetch all projects for the admin list page (all statuses).
 */
export async function getAdminProjects(options: {
  page?: number;
  pageSize?: number;
  status?: ProjectStatus;
  search?: string;
}) {
  const { page = 1, pageSize = 20, status, search } = options;
  const skip = (page - 1) * pageSize;

  const where = {
    ...(status && { status }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { slug: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        featured: true,
        priceMode: true,
        price: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { id: true, name: true } },
        provider: { select: { id: true, displayName: true } },
        images: {
          where: { isPrimary: true },
          take: 1,
          select: { url: true },
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

// ─── Single ──────────────────────────────────────────────────────────────────

/**
 * Fetch a single project by ID for the admin edit form.
 * Returns all relations needed to populate the form.
 */
export async function getAdminProjectById(id: string) {
  return db.project.findUnique({
    where: { id },
    include: {
      category: true,
      provider: true,
      images: { orderBy: { sortOrder: "asc" } },
      features: { orderBy: { sortOrder: "asc" } },
      specifications: { orderBy: { sortOrder: "asc" } },
      faqs: { orderBy: { sortOrder: "asc" } },
      technologies: { include: { technology: true } },
    },
  });
}

// ─── Selectors ───────────────────────────────────────────────────────────────

/** All active categories for the category selector. */
export async function getAdminCategories() {
  return db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

/** All active technologies for the technology selector. */
export async function getAdminTechnologies() {
  return db.technology.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

/** All active providers for the provider selector. */
export async function getAdminProviderList() {
  return db.projectProvider.findMany({
    where: { isActive: true },
    orderBy: { displayName: "asc" },
    select: {
      id: true,
      displayName: true,
      email: true,
      whatsappNumber: true,
    },
  });
}
