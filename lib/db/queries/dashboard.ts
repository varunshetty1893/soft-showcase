// lib/db/queries/dashboard.ts
// Aggregation and statistics queries for the /admin dashboard.

import { db } from "@/lib/db/client";

export async function getAdminDashboardStats() {
  const [
    totalProjects,
    publishedProjects,
    draftProjects,
    totalProviders,
    // "Active Builders" = providers that are genuinely live: active, approved,
    // and not in a removed/soft-deleted state. Counting isActive=true alone
    // inflates the figure with pending or suspended records.
    activeProviders,
    totalInquiries,
    newInquiries,
    totalRequests,
    newRequests,
    totalUsers,
  ] = await Promise.all([
    db.project.count(),
    db.project.count({ where: { status: "PUBLISHED" } }),
    db.project.count({ where: { status: "DRAFT" } }),
    db.projectProvider.count(),
    db.projectProvider.count({
      where: {
        isActive: true,
        applicationStatus: "approved",
        removedAt: null,
      },
    }),
    db.inquiry.count(),
    db.inquiry.count({ where: { status: "NEW" } }),
    db.customProjectRequest.count(),
    db.customProjectRequest.count({ where: { status: "NEW" } }),
    db.user.count(),
  ]);

  const [
    inactiveProviderAlerts,
    recentInquiries,
    recentRequests,
    recentAuditLogs,
  ] = await Promise.all([
    // Critical alert: Projects that are PUBLISHED but whose provider is not
    // fully valid (inactive, not approved, unconfirmed consent, or removed).
    // Checking all four conditions prevents false negatives where e.g. a
    // pending provider somehow has a published project.
    db.project.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { provider: { isActive: false } },
          { provider: { applicationStatus: { not: "approved" } } },
          { provider: { providerConsentConfirmed: false } },
          { provider: { removedAt: { not: null } } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        provider: {
          select: {
            id: true,
            displayName: true,
            isActive: true,
            applicationStatus: true,
            providerConsentConfirmed: true,
            removedAt: true,
          },
        },
      },
    }),
    // Recent 5 inquiries
    db.inquiry.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        project: { select: { title: true, slug: true } },
      },
    }),
    // Recent 5 custom requests
    db.customProjectRequest.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        projectTitle: true,
        status: true,
        budget: true,
        createdAt: true,
      },
    }),
    // Recent 5 audit logs
    db.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    counts: {
      projects: {
        total: totalProjects,
        published: publishedProjects,
        draft: draftProjects,
      },
      providers: {
        total: totalProviders,
        active: activeProviders,
      },
      inquiries: {
        total: totalInquiries,
        new: newInquiries,
      },
      requests: {
        total: totalRequests,
        new: newRequests,
      },
      users: {
        total: totalUsers,
      },
    },
    alerts: {
      inactiveProviderProjects: inactiveProviderAlerts,
    },
    recent: {
      inquiries: recentInquiries,
      requests: recentRequests,
      auditLogs: recentAuditLogs,
    },
  };
}
