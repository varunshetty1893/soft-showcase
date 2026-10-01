// app/sitemap.ts
// Generates XML sitemap for Soft Showcase.
// Only includes public, indexable URLs on the production domain.
// Static routes use a stable build-time date; project routes use real database updatedAt.

import type { MetadataRoute } from "next";
import { APP_URL } from "@/config/constants";
import { db } from "@/lib/db/client";

// Fixed build-time reference date for static content routes
const STATIC_PAGE_DATE = new Date("2025-01-01T00:00:00.000Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = APP_URL.replace(/\/$/, "");

  // Public indexable static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: STATIC_PAGE_DATE,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: STATIC_PAGE_DATE,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/custom-project`,
      lastModified: STATIC_PAGE_DATE,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/become-a-partner`,
      lastModified: STATIC_PAGE_DATE,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: STATIC_PAGE_DATE,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: STATIC_PAGE_DATE,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: STATIC_PAGE_DATE,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Dynamic project pages — only PUBLISHED projects with approved active providers
  let projectRoutes: MetadataRoute.Sitemap = [];
  try {
    const projects = await db.project.findMany({
      where: {
        status: "PUBLISHED",
        provider: {
          isActive: true,
          applicationStatus: "approved",
        },
      },
      select: { slug: true, updatedAt: true },
    });

    projectRoutes = projects.map((project) => ({
      url: `${baseUrl}/projects/${project.slug}`,
      lastModified: project.updatedAt ? new Date(project.updatedAt) : STATIC_PAGE_DATE,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (err) {
    console.warn("Sitemap: Could not fetch projects from database:", err);
  }

  return [...staticRoutes, ...projectRoutes];
}
