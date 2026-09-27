// lib/db/queries/categories.ts
// Database query helpers for categories and technologies.

import { db } from "@/lib/db/client";

/**
 * Get all active categories for navigation/filters.
 */
export async function getActiveCategories() {
  return db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { projects: { where: { status: "PUBLISHED" } } },
      },
    },
  });
}

/**
 * Get all active technologies for filter chips.
 */
export async function getActiveTechnologies() {
  return db.technology.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Get a single category by slug.
 */
export async function getCategoryBySlug(slug: string) {
  return db.category.findUnique({ where: { slug } });
}
