// app/admin/audit-logs/page.tsx
// Admin audit log viewer page (Phase 5).
// Server-rendered and driven by URL search params so results are shareable and survive Back/refresh.
// Source of truth: docs/32-audit-logging.md & Phase 5 specification.

import type { Metadata } from "next";
import { getAdminAuditLogs } from "@/lib/db/audit";
import AuditLogsView, {
  type SerializedAuditLogRow,
} from "@/components/admin/AuditLogsView";

export const metadata: Metadata = {
  title: "Audit Logs — Admin | Soft Showcase",
};

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;

  const {
    logs,
    total,
    totalPages,
    currentPage,
    pageSize,
    filters,
    filterOptions,
  } = await getAdminAuditLogs(rawParams);

  const serializedLogs: SerializedAuditLogRow[] = logs.map((row) => ({
    id: row.id,
    userId: row.userId,
    action: row.action,
    actionCategory: row.actionCategory,
    entityType: row.entityType,
    entityId: row.entityId,
    details: row.details,
    createdAtIso:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt).toISOString(),
    actor: row.actor,
    entity: row.entity,
  }));

  return (
    <AuditLogsView
      logs={serializedLogs}
      total={total}
      totalPages={totalPages}
      currentPage={currentPage}
      pageSize={pageSize}
      filters={filters}
      filterOptions={filterOptions}
    />
  );
}
