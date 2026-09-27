// app/sitemap.ts
// Generates a dynamic XML sitemap for the application.
// Project detail pages are added dynamically from the database.
// See: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap

import type { MetadataRoute } from "next";
import { APP_URL } from "@/config/constants";
import { db } from "@/lib/db/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${APP_URL}/projects`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${APP_URL}/custom-project`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  // Dynamic project pages — only published projects
  let projectRoutes: MetadataRoute.Sitemap = [];
  try {
    const projects = await db.project.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    });

    projectRoutes = projects.map((project) => ({
      url: `${APP_URL}/projects/${project.slug}`,
      lastModified: project.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // If DB is unreachable during build, return only static routes
    console.warn("Sitemap: Could not fetch projects from database.");
  }

  return [...staticRoutes, ...projectRoutes];
}
