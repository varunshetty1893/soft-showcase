// app/admin/inquiries/page.tsx
// Admin inquiries management table page.
// Source of truth: docs/25-inquiry-system.md & docs/08-page-specifications.md

import type { Metadata } from "next";
import Link from "next/link";
import { getAdminInquiries } from "@/lib/db/queries/inquiries";
import { InquiryStatusBadge } from "@/components/customer/InquiryStatusBadge";
import type { InquiryStatus } from "@prisma/client";
import {
  MessageSquare,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Inquiries — Admin | Soft Showcase",
};

const STATUS_FILTERS: { label: string; value?: InquiryStatus }[] = [
  { label: "All Inquiries" },
  { label: "New", value: "NEW" },
  { label: "Contacted", value: "CONTACTED" },
  { label: "Discussing", value: "DISCUSSING" },
  { label: "Quoted", value: "QUOTED" },
  { label: "Closed", value: "CLOSED" },
];

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page: pageStr, status: statusStr } = await searchParams;
  const page = parseInt(pageStr || "1", 10);
  const status = (statusStr as InquiryStatus) || undefined;

  const { inquiries, total, totalPages } = await getAdminInquiries({
    page: isNaN(page) ? 1 : page,
    status,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            Project Inquiries
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review customer interest, route communications, and monitor provider correspondence.
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 shadow-xs self-start sm:self-auto">
          {total} Total Inquiries
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => {
          const isActive = f.value ? status === f.value : !status;
          const href = f.value
            ? `/admin/inquiries?status=${f.value}`
            : `/admin/inquiries`;

          return (
            <Link
              key={f.label}
              href={href}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white font-semibold shadow-xs"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Inquiries Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {inquiries.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">No inquiries found</p>
            <p className="text-xs text-gray-500 mt-1">
              {status
                ? `No inquiries match the "${status}" status filter.`
                : "No customer inquiries have been submitted yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Notification</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inquiries.map((inq) => {
                  const formattedDate = new Date(inq.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={inq.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{inq.name}</div>
                        <div className="text-gray-500 text-[11px] truncate max-w-[140px]">
                          {inq.email}
                        </div>
                        {inq.whatsapp && (
                          <div className="text-emerald-700 text-[10px] truncate max-w-[140px]">
                            {inq.whatsapp}
                          </div>
                        )}
                      </td>

                      {/* Project */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/projects/${inq.project.slug}`}
                          target="_blank"
                          className="font-medium text-gray-900 hover:text-indigo-600 truncate block max-w-[180px]"
                        >
                          {inq.project.title}
                        </Link>
                      </td>

                      {/* Provider */}
                      <td className="py-3 px-4 text-gray-700">
                        <span className="font-medium">{inq.provider.displayName}</span>
                      </td>

                      {/* Method */}
                      <td className="py-3 px-4">
                        {inq.contactMethod === "WHATSAPP" ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            WhatsApp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-indigo-700 font-medium">
                            <Mail className="w-3 h-3 text-indigo-600" />
                            Email
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <InquiryStatusBadge status={inq.status} />
                      </td>

                      {/* Notification Status */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                            inq.notificationStatus === "SENT"
                              ? "text-emerald-700"
                              : inq.notificationStatus === "FAILED"
                              ? "text-rose-700 font-bold"
                              : "text-amber-700"
                          }`}
                        >
                          {inq.notificationStatus === "SENT" ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : inq.notificationStatus === "FAILED" ? (
                            <AlertCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {inq.notificationStatus}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {formattedDate}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <Link href={`/admin/inquiries/${inq.id}`}>
                          <Button variant="outline" size="sm" className="h-7 text-xs px-2.5">
                            Manage
                          </Button>
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
                <Link
                  href={`/admin/inquiries?page=${page - 1}${
                    status ? `&status=${status}` : ""
                  }`}
                >
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    Previous
                  </Button>
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/inquiries?page=${page + 1}${
                    status ? `&status=${status}` : ""
                  }`}
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
