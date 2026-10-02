// lib/db/queries/public-filters.ts
// Shared public query filter helpers (Phase 2B).
// Ensures deactivated, unapproved, or soft-removed providers and their projects
// are hidden across every public surface (listings, project pages, search, featured, sitemap, JSON-LD).

import type { ProjectStatus } from "@prisma/client";

export function publicProviderWhere<T extends Record<string, unknown> = Record<string, unknown>>(
  extra?: T
) {
  return {
    ...(extra || ({} as T)),
    isActive: true,
    applicationStatus: "approved",
    removedAt: null,
  };
}

export function publicProjectWhere<T extends Record<string, unknown> = Record<string, unknown>>(
  extra?: T
) {
  return {
    status: "PUBLISHED" as ProjectStatus,
    provider: publicProviderWhere(),
    ...(extra || ({} as T)),
  };
}
