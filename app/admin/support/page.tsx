// app/admin/support/page.tsx
// Admin support desk: manage all customer and partner tickets with search and pagination.

import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminSupportTicketsPaginated } from "@/lib/db/queries/support";
import { Headphones, MessageSquare, ArrowRight } from "lucide-react";
import { APP_NAME } from "@/config/constants";
import { TablePagination } from "@/components/common/TablePagination";
import { SupportFilterBar } from "@/components/admin/SupportFilterBar";

export const metadata: Metadata = {
  title: `Support Tickets — Admin — ${APP_NAME}`,
  robots: { index: false },
};

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string; role?: string }>;
}) {
  await requireAdmin(true);

  const { page: pageStr, search: searchStr, status: statusStr, role: roleStr } = await searchParams;
  const page = parseInt(pageStr || "1", 10) || 1;
  const search = searchStr || undefined;
  const status = statusStr || undefined;
  const role = roleStr || undefined;

  const pageSize = 20;
  const { tickets, total, totalPages } = await getAdminSupportTicketsPaginated({
    page,
    pageSize,
    search,
    status,
    requesterRole: role,
  });

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <Headphones className="w-5 h-5 text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-950">
              Platform Support Desk
            </h1>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Manage inquiries, dispute resolutions, and verification questions from Customers and Solution Partners.
          </p>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-600 shadow-xs self-start sm:self-auto">
          {total} Total Tickets
        </div>
      </div>

      {/* ── Search & Filter Bar ─────────────────────────────────────────── */}
      <SupportFilterBar />

      {/* ── Tickets List ───────────────────────────────────────────────── */}
      {tickets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-xs space-y-2">
          <Headphones className="w-8 h-8 text-gray-400 mx-auto" />
          <h3 className="text-base font-bold text-gray-900">No Support Tickets Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {search
              ? `No tickets match "${search}". Try searching by a different term.`
              : "Support tickets opened by users or partners will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            {tickets.map((t: any) => (
              <Link
                key={t.id}
                href={`/admin/support/${t.id}`}
                className="block bg-white rounded-2xl border border-gray-200 p-5 shadow-xs hover:border-indigo-600 transition-all hover:shadow-md"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-indigo-600">
                        {t.ticketNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === "RESOLVED" || t.status === "CLOSED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : t.status === "IN_PROGRESS"
                            ? "bg-sky-50 text-sky-700 border border-sky-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {t.status}
                      </span>
                      <span className="text-[10px] bg-gray-100 text-gray-700 font-semibold px-2 py-0.5 rounded">
                        Role: {t.requesterRole}
                      </span>
                      <span className="text-[10px] text-gray-500 font-semibold">
                        Category: {t.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-gray-900">{t.subject}</h3>
                    <p className="text-xs text-gray-500 line-clamp-1">{t.description}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">{t.requester?.name || "User"}</div>
                      <div className="text-[10px] text-gray-400">{t.requester?.email}</div>
                    </div>
                    <span className="flex items-center gap-1 font-semibold text-indigo-600">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {t._count?.messages ?? 0}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination Footer */}
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            itemName="support tickets"
          />
        </div>
      )}
    </div>
  );
}
