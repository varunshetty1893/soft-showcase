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
