// lib/db/queries/providers.ts
// Database query helpers for project providers.
// These are server-side only.

import { db } from "@/lib/db/client";

/**
 * Get a provider by ID — returns full record for admin use.
 */
export async function getProviderById(id: string) {
  return db.projectProvider.findUnique({ where: { id } });
}

/**
 * Get the provider assigned to a project.
 * Used by server-side contact routing — never expose to client directly.
 */
export async function getProviderForProject(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: {
      provider: {
        select: {
          id: true,
          displayName: true,
          email: true,
          whatsappNumber: true,
          showEmail: true,
          showWhatsapp: true,
          isActive: true,
          providerConsentConfirmed: true,
        },
      },
    },
  });
  return project?.provider ?? null;
}

/**
 * Get all providers for admin listings.
 */
export async function getAllProviders() {
  return db.projectProvider.findMany({
    orderBy: { displayName: "asc" },
    include: { _count: { select: { projects: true } } },
  });
}
