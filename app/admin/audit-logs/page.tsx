// app/admin/audit-logs/page.tsx
// Admin audit log viewer page with Phase 5 search, filters, readable actors/entities, and CSV export.
// Source of truth: docs/32-audit-logging.md & docs/08-page-specifications.md

import type { Metadata } from "next";
import { getAdminAuditLogs } from "@/lib/db/audit";
import { AuditLogsView } from "@/components/admin/AuditLogsView";

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

  return (
    <AuditLogsView
      logs={logs}
      total={total}
      totalPages={totalPages}
      currentPage={currentPage}
      pageSize={pageSize}
      filters={filters}
      filterOptions={filterOptions}
    />
  );
}
