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
import { buttonVariants } from "@/components/ui/button";
import { TableSearchBar } from "@/components/common/TableSearchBar";
import { TablePagination } from "@/components/common/TablePagination";
import { ADMIN_PAGE_SIZE } from "@/config/constants";

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
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
  const { page: pageStr, status: statusStr, search: searchStr } = await searchParams;
  const page = parseInt(pageStr || "1", 10);
  const status = (statusStr as InquiryStatus) || undefined;
  const search = searchStr || undefined;

  const { inquiries, total, totalPages } = await getAdminInquiries({
    page: isNaN(page) ? 1 : page,
    status,
    search,
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

      {/* Search Bar & Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <TableSearchBar
          placeholder="Search by customer, email, project, or provider..."
          className="sm:max-w-xs"
        />

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1">
          {STATUS_FILTERS.map((f) => {
            const isActive = f.value ? status === f.value : !status;
            const params = new URLSearchParams();
            if (f.value) params.set("status", f.value);
            if (search) params.set("search", search);
            const href = params.toString()
              ? `/admin/inquiries?${params.toString()}`
              : `/admin/inquiries`;

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
      </div>

      {/* Inquiries Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {inquiries.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500">
            <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <p className="font-semibold text-gray-900">No inquiries found</p>
            <p className="text-xs text-gray-500 mt-1">
              {search
                ? `No inquiries match "${search}". Try a different keyword.`
                : status
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
                          className="font-medium text-gray-900 hover:text-[#155761] truncate block max-w-[180px]"
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
                          <span className="inline-flex items-center gap-1 text-[#155761] font-medium">
                            <Mail className="w-3 h-3 text-[#155761]" />
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
                        <Link href={`/admin/inquiries/${inq.id}`} className={buttonVariants({ variant: "outline", size: "sm", className: "h-7 text-xs px-2.5" })}>
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
        <TablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={ADMIN_PAGE_SIZE}
          itemName="inquiries"
        />
      </div>
    </div>
  );
}
