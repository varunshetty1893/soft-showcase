// app/admin/custom-requests/page.tsx
// Admin custom project requests management table page.
// Source of truth: docs/26-custom-project-system.md & docs/08-page-specifications.md

import type { Metadata } from "next";
import Link from "next/link";
import { getAdminCustomRequests } from "@/lib/db/queries/custom-requests";
import { RequestStatusBadge } from "@/components/customer/RequestStatusBadge";
import type { CustomRequestStatus } from "@prisma/client";
import {
  FileQuestion,
  Tag,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Custom Requests — Admin | Soft Showcase",
};

const STATUS_FILTERS: { label: string; value?: CustomRequestStatus }[] = [
  { label: "All Requests" },
  { label: "New", value: "NEW" },
  { label: "Under Review", value: "REVIEWING" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Declined", value: "DECLINED" },
];

export default async function AdminCustomRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page: pageStr, status: statusStr } = await searchParams;
  const page = parseInt(pageStr || "1", 10);
  const status = (statusStr as CustomRequestStatus) || undefined;

  const { requests, total, totalPages } = await getAdminCustomRequests({
    page: isNaN(page) ? 1 : page,
    status,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            Custom Project Requests
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Evaluate bespoke software proposals, review scopes, and assign engineering leads.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 shadow-xs self-start sm:self-auto">
          {total} Total Requests
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => {
          const isActive = f.value ? status === f.value : !status;
          const href = f.value
            ? `/admin/custom-requests?status=${f.value}`
            : `/admin/custom-requests`;

          return (
            <Link
              key={f.label}
              href={href}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-[#155761] text-white font-semibold shadow-xs"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Custom Requests Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {requests.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            <FileQuestion className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">No requests found</p>
            <p className="text-xs text-gray-500 mt-1">
              {status
                ? `No custom requests match the "${status}" status filter.`
                : "No custom software requests have been submitted yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Project Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Budget / Target</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((req) => {
                  const formattedDate = new Date(req.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{req.name}</div>
                        <div className="text-gray-500 text-[11px] truncate max-w-[140px]">
                          {req.email}
                        </div>
                        {req.whatsapp && (
                          <div className="text-emerald-700 text-[10px] truncate max-w-[140px]">
                            {req.whatsapp}
                          </div>
                        )}
                      </td>

                      {/* Project Title */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/custom-requests/${req.id}`}
                          className="font-medium text-gray-900 hover:text-[#155761] truncate block max-w-[190px]"
                        >
                          {req.projectTitle}
                        </Link>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-gray-700">
                        {req.category ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px]">
                            <Tag className="w-3 h-3 text-gray-400" />
                            {req.category}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </td>

                      {/* Budget / Target */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5">
                          {req.budget && (
                            <span className="text-emerald-700 font-medium text-[11px]">
                              {req.budget}
                            </span>
                          )}
                          {req.deadline && (
                            <span className="text-amber-700 text-[10px]">
                              Due: {req.deadline}
                            </span>
                          )}
                          {!req.budget && !req.deadline && (
                            <span className="text-gray-400 italic text-[11px]">Flexible</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <RequestStatusBadge status={req.status} />
                      </td>

                      {/* Submitted */}
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/custom-requests/${req.id}`} className={buttonVariants({ variant: "outline", size: "sm", className: "h-7 text-xs px-2.5" })}>
                            Manage
                          </Link>
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
                <Link href={`/admin/custom-requests?page=${page - 1}${
                    status ? `&status=${status}` : ""
                  }`} className={buttonVariants({ variant: "outline", size: "sm", className: "h-7 text-xs" })}>
                    Previous
                  </Link>
              )}
              {page < totalPages && (
                <Link href={`/admin/custom-requests?page=${page + 1}${
                    status ? `&status=${status}` : ""
                  }`} className={buttonVariants({ variant: "outline", size: "sm", className: "h-7 text-xs" })}>
                    Next
                  </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
