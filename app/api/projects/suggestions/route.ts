// app/api/projects/suggestions/route.ts
// Real-time catalog search suggestions & autocomplete endpoint.
// Grounded in actual published projects, active categories, and active technologies.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { publicProjectWhere } from "@/lib/db/queries/public-filters";
import { buildCatalogSuggestions } from "@/lib/search/catalog-search";
import { DEFAULT_CATEGORIES } from "@/config/categories";
import { DEFAULT_TECHNOLOGIES } from "@/config/technologies";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim().slice(0, 80);

  let projects: any[] = [];
  let categories = DEFAULT_CATEGORIES.map((c) => ({ name: c.name, slug: c.slug }));
  let technologies = DEFAULT_TECHNOLOGIES.map((t) => ({ name: t.name, slug: t.slug }));

  try {
    const [dbProjects, dbCategories, dbTechnologies] = await Promise.all([
      db.project
        .findMany({
          where: publicProjectWhere(),
          take: 60,
          orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
          select: {
            id: true,
            title: true,
            slug: true,
            shortDescription: true,
            fullDescription: true,
            projectType: true,
            whatsIncluded: true,
            featured: true,
            createdAt: true,
            category: {
              select: { id: true, name: true, slug: true },
            },
            technologies: {
              include: {
                technology: {
                  select: { id: true, name: true, slug: true },
                },
              },
            },
            features: {
              select: { feature: true },
            },
            specifications: {
              select: { key: true, value: true },
            },
          },
        })
        .catch(() => []),
      db.category
        .findMany({
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: { name: true, slug: true },
        })
        .catch(() => []),
      db.technology
        .findMany({
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: { name: true, slug: true },
        })
        .catch(() => []),
    ]);

    if (Array.isArray(dbProjects)) {
      projects = dbProjects;
    }
    if (Array.isArray(dbCategories) && dbCategories.length > 0) {
      categories = dbCategories;
    }
    if (Array.isArray(dbTechnologies) && dbTechnologies.length > 0) {
      // Merge DB technologies with default technologies so all canonical tech suggestions are available
      const mergedMap = new Map<string, { name: string; slug: string }>();
      for (const t of dbTechnologies) {
        mergedMap.set(t.slug, t);
      }
      for (const dt of DEFAULT_TECHNOLOGIES) {
        if (!mergedMap.has(dt.slug)) {
          mergedMap.set(dt.slug, { name: dt.name, slug: dt.slug });
        }
      }
      technologies = Array.from(mergedMap.values());
    }
  } catch {
    // Fallback to defaults if DB is unavailable
  }

  const payload = buildCatalogSuggestions({
    query: q,
    projects,
    categories,
    technologies,
  });

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
    },
  });
}
