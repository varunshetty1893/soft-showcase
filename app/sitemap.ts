// app/sitemap.ts
// Generates a dynamic XML sitemap for Soft Showcase.
// Only includes public, indexable URLs on the production domain.
// Excludes private customer dashboards, admin panels, auth routes, and API endpoints.

import type { MetadataRoute } from "next";
import { APP_URL } from "@/config/constants";
import { db } from "@/lib/db/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = APP_URL.replace(/\/$/, "");

  // Public indexable static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/custom-project`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
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
      lastModified: project.updatedAt ? new Date(project.updatedAt) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (err) {
    console.warn("Sitemap: Could not fetch projects from database:", err);
  }

  return [...staticRoutes, ...projectRoutes];
}
