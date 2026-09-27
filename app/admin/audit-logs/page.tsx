// app/admin/audit-logs/page.tsx
// Admin audit log viewer page.
// Source of truth: docs/32-audit-logging.md & docs/08-page-specifications.md

import type { Metadata } from "next";
import Link from "next/link";
import { getAdminAuditLogs } from "@/lib/db/audit";
import { History, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Audit Logs — Admin | Soft Showcase",
};

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; entityType?: string }>;
}) {
  const { page: pageStr, action, entityType } = await searchParams;
  const page = parseInt(pageStr || "1", 10);

  const { logs, total, totalPages } = await getAdminAuditLogs({
    page: isNaN(page) ? 1 : page,
    action: action || undefined,
    entityType: entityType || undefined,
    pageSize: 25,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 flex items-center gap-2">
            <History className="w-6 h-6 text-[#155761]" />
            <span>Audit Trail & Activity Logs</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Immutable log of administrative actions, data changes, and workflow transitions.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 shadow-xs self-start sm:self-auto">
          {total} Total Audit Records
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            <History className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">No audit log entries found</p>
            <p className="text-xs text-gray-500 mt-1">
              Actions performed by administrators will appear here chronologically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Admin / Actor</th>
                  <th className="py-3 px-4">Payload / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const formattedTime = new Date(log.createdAt).toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "medium",
                  });

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50/60 transition-colors align-top"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap font-mono text-[11px]">
                        {formattedTime}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] font-mono text-[11px] font-semibold">
                          {log.action}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">{log.entityType}</div>
                        {log.entityId && (
                          <div className="text-gray-400 font-mono text-[10px] truncate max-w-[130px]">
                            {log.entityId}
                          </div>
                        )}
                      </td>

                      {/* Admin User */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.userId ? (
                          <span className="inline-flex items-center gap-1 font-mono text-gray-600 text-[11px]">
                            <Shield className="w-3 h-3 text-[#155761]" />
                            {log.userId.slice(0, 10)}...
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">System</span>
                        )}
                      </td>

                      {/* Details JSON */}
                      <td className="py-3 px-4 max-w-sm">
                        {log.details ? (
                          <details className="cursor-pointer group">
                            <summary className="text-[11px] text-[#155761] hover:text-[#10474F] font-medium select-none">
                              View Payload
                            </summary>
                            <pre className="mt-1.5 p-2 bg-gray-900 text-gray-100 rounded-lg text-[10px] font-mono overflow-x-auto max-h-36">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/audit-logs?page=${page - 1}${
                    action ? `&action=${action}` : ""
                  }${entityType ? `&entityType=${entityType}` : ""}`}
                >
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    Previous
                  </Button>
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/audit-logs?page=${page + 1}${
                    action ? `&action=${action}` : ""
                  }${entityType ? `&entityType=${entityType}` : ""}`}
                >
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    Next
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
