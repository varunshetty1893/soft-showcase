// lib/db/audit.ts
// Audit logging service for recording administrative and system actions.
// Source of truth: docs/32-audit-logging.md

import { db } from "@/lib/db/client";
import { Prisma } from "@prisma/client";

export interface AuditOptions {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
}

export type AuditActionCategory = "created_approved" | "updated" | "rejected_deleted" | "other";

export function getAuditActionCategory(action: string): AuditActionCategory {
  const upper = (action || "").toUpperCase();
  if (
    upper.includes("CREATE") ||
    upper.includes("APPROV") ||
    upper.includes("ACTIVAT") ||
    upper.includes("RESTORE") ||
    upper.includes("PUBLISH")
  ) {
    return "created_approved";
  }
  if (
    upper.includes("REMOVE") ||
    upper.includes("REJECT") ||
    upper.includes("DELETE") ||
    upper.includes("DENIED")
  ) {
    return "rejected_deleted";
  }
  if (upper.includes("UPDATE") || upper.includes("MODERAT") || upper.includes("EDIT")) {
    return "updated";
  }
  return "other";
}

export type AuditPageSize = 25 | 50 | 100;

export interface AuditFilterOptions {
  actions?: string[];
  entityTypes?: string[];
  distinctActions: string[];
  distinctEntityTypes: string[];
  actors: { id: string; label: string; name?: string | null; email?: string | null }[];
}

export interface AuditLogFilterState {
  q: string;
  actions: string[];
  entityTypes: string[];
  actor: string;
  from: string;
  to: string;
  sort: "newest" | "oldest";
  page: number;
  pageSize: AuditPageSize;
}

/**
 * Write a new audit log entry.
 * Fails safely without throwing so that critical user flows are not disrupted.
 */
export async function createAuditLog(options: AuditOptions): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: options.userId ?? undefined,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId ?? undefined,
        details: options.details ? (options.details as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });
  } catch (error) {
    // Non-blocking error handling as per docs/32-audit-logging.md
    console.error("[AuditLog] Failed to write audit log:", error);
  }
}

export const recordAuditLog = createAuditLog;

export const writeAuditLog = async (options: {
  userId?: string | null;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> => {
  return createAuditLog({
    userId: options.actorId || options.userId || null,
    action: options.action,
    entityType: options.entityType,
    entityId: options.entityId,
    details: options.metadata || options.details,
  });
};

/**
 * Query audit logs for the admin panel with filtering and pagination.
 */
export async function getAdminAuditLogs(options: {
  page?: number;
  pageSize?: number;
  action?: string;
  entityType?: string;
}) {
  const { page = 1, pageSize = 25, action, entityType } = options;
  const skip = (page - 1) * pageSize;

  const where: Prisma.AuditLogWhereInput = {
    ...(action && { action }),
    ...(entityType && { entityType }),
  };

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    totalPages: Math.ceil(total / pageSize),
    currentPage: page,
  };
}

export async function exportAdminAuditLogsCsv(..._args: any[]): Promise<{ csv: string }> {
  void _args;
  const { logs } = await getAdminAuditLogs({
    page: 1,
    pageSize: 10000,
  });
  const header = "id,action,entityType,entityId,userId,createdAt\n";
  const rows = logs
    .map((l) =>
      [l.id, l.action, l.entityType, l.entityId || "", l.userId || "", l.createdAt.toISOString()]
        .map((f) => `"${String(f).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
  return { csv: header + rows };
}
