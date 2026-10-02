// lib/db/queries/providers.ts
// Database query helpers for project providers.
// These are server-side only.

import { db, ensureAdditiveSchema } from "@/lib/db/client";
import { publicProviderWhere, publicProjectWhere } from "./public-filters";

export { publicProviderWhere, publicProjectWhere };

/**
 * Get a provider by ID — returns full record for admin use.
 */
export async function getProviderById(id: string) {
  await ensureAdditiveSchema();
  return db.projectProvider.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, isAdmin: true },
      },
    },
  });
}

/**
 * Verify if a provider is active, approved, and not removed to receive customer inquiries/leads.
 */
export function isProviderEligibleForRouting(
  provider: {
    isActive?: boolean | null;
    applicationStatus?: string | null;
    removedAt?: Date | string | null;
  } | null | undefined
): boolean {
  if (!provider || !provider.isActive) return false;
  if (provider.removedAt) return false;
  if (provider.applicationStatus && provider.applicationStatus !== "approved") {
    return false;
  }
  return true;
}

/**
 * Get the provider assigned to a project.
 * Used by server-side contact routing — never expose to client directly.
 */
export async function getProviderForProject(projectId: string) {
  await ensureAdditiveSchema();
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
          applicationStatus: true,
          providerConsentConfirmed: true,
          removedAt: true,
        },
      },
    },
  });
  return project?.provider ?? null;
}

/**
 * Get all providers for admin listings with pagination and impact counts.
 */
export async function getAllProviders(options?: { page?: number; pageSize?: number }) {
  await ensureAdditiveSchema();
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 100;
  const skip = (page - 1) * pageSize;

  const providers = await db.projectProvider.findMany({
    orderBy: { displayName: "asc" },
    skip,
    take: pageSize,
    include: {
      user: {
        select: {
          id: true,
          role: true,
          isAdmin: true,
          _count: { select: { supportTickets: true } },
        },
      },
      _count: {
        select: {
          projects: true,
          inquiries: true,
          transactions: true,
        },
      },
    },
  });

  // Also count published projects per provider for accurate deactivation impact preview
  const enriched = await Promise.all(
    providers.map(async (p) => {
      let publishedProjectsCount = 0;
      try {
        publishedProjectsCount = await db.project.count({
          where: { providerId: p.id, status: "PUBLISHED" },
        });
      } catch {
        publishedProjectsCount = p._count?.projects ?? 0;
      }

      let supportTicketsCount = (p.user as any)?._count?.supportTickets ?? 0;
      if (supportTicketsCount === 0 && p.userId) {
        try {
          supportTicketsCount = await db.supportTicket.count({
            where: { requesterId: p.userId },
          });
        } catch {
          supportTicketsCount = 0;
        }
      }

      return {
        ...p,
        publishedProjectsCount,
        _count: {
          projects: p._count?.projects ?? 0,
          inquiries: p._count?.inquiries ?? 0,
          transactions: p._count?.transactions ?? 0,
          supportTickets: supportTicketsCount,
        },
      };
    })
  );

  return enriched;
}
