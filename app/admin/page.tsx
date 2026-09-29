// app/admin/page.tsx
// Main Admin Dashboard with real-time database stats, inactive provider alerts,
// and recent inquiries, custom requests, and audit trail.
// Source of truth: docs/36-development-roadmap.md & docs/08-page-specifications.md

import type { Metadata } from "next";
import Link from "next/link";
import { getAdminDashboardStats } from "@/lib/db/queries/dashboard";
import {
  FolderGit2,
  Users,
  MessageSquare,
  FileQuestion,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  UploadCloud,
  History,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { InquiryStatusBadge } from "@/components/customer/InquiryStatusBadge";
import { RequestStatusBadge } from "@/components/customer/RequestStatusBadge";

export const metadata: Metadata = {
  title: "Dashboard — Admin | Soft Showcase",
};

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();
  const { counts, alerts, recent } = stats;

  return (
    <div className="space-y-8">
      {/* ── Page Header & Quick Actions ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950">
            Platform Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time platform metrics, catalog health, and customer inquiries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/admin/projects/new" className={buttonVariants({ variant: "primary", size: "sm", className: "gap-1.5 shadow-sm text-xs" })}>
              <PlusCircle className="w-3.5 h-3.5" />
              New Project
            </Link>
          <Link href="/admin/projects/import" className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 text-xs" })}>
              <UploadCloud className="w-3.5 h-3.5 text-[#155761]" />
              Import JSON
            </Link>
          <Link href="/admin/providers/new" className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 text-xs" })}>
              <Users className="w-3.5 h-3.5 text-gray-600" />
              Add Provider
            </Link>
        </div>
      </div>

      {/* ── Critical Alert: Inactive Provider on Published Projects ────── */}
      {alerts.inactiveProviderProjects.length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <span>Action Required: Published Projects with Inactive Providers</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-200/80 text-amber-900">
                  {alerts.inactiveProviderProjects.length}
                </span>
              </h3>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                The following projects are currently <strong>PUBLISHED</strong> on the
                marketplace, but their assigned provider is either marked inactive or has
                unconfirmed publishing consent. Visitors cannot reliably reach these providers.
              </p>

              <div className="mt-3 divide-y divide-amber-200/60 bg-white/70 rounded-xl border border-amber-200/80 overflow-hidden">
                {alerts.inactiveProviderProjects.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 flex items-center justify-between gap-4 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-gray-900">{p.title}</span>
                      <span className="text-gray-500 ml-2 font-mono">({p.slug})</span>
                      <div className="text-amber-700 text-[11px] mt-0.5">
                        Provider: <strong>{p.provider.displayName}</strong>
                        {!p.provider.isActive && " (Inactive)"}
                        {!p.provider.providerConsentConfirmed && " (Consent Pending)"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        href={`/admin/projects/${p.id}/edit`}
                        className="font-medium text-[#155761] hover:text-[#10474F] underline"
                      >
                        Edit Project
                      </Link>
                      <span className="text-gray-300">|</span>
                      <Link
                        href={`/admin/providers/${p.provider.id}/edit`}
                        className="font-medium text-amber-800 hover:text-amber-950 underline"
                      >
                        Edit Provider
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Key Metrics Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Projects Metric */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Projects
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#F3F7F7] text-[#155761] flex items-center justify-center">
              <FolderGit2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-950">
            {counts.projects.total}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <span className="font-semibold text-emerald-600">
              {counts.projects.published} Published
            </span>
            <span>•</span>
            <span className="font-medium text-gray-500">
              {counts.projects.draft} Drafts
            </span>
          </div>
        </div>

        {/* Providers Metric */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Providers
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-950">
            {counts.providers.total}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            <span className="font-semibold text-purple-600">
              {counts.providers.active} Active Builders
            </span>
          </div>
        </div>

        {/* Inquiries Metric */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Inquiries
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-950">
            {counts.inquiries.total}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            <span className="font-semibold text-blue-600">
              {counts.inquiries.new} New / Unreviewed
            </span>
          </div>
        </div>

        {/* Custom Requests Metric */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Custom Requests
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileQuestion className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-gray-950">
            {counts.requests.total}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            <span className="font-semibold text-amber-600">
              {counts.requests.new} Pending Review
            </span>
          </div>
        </div>
      </div>

      {/* ── Recent Activity Grids ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Inquiries Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-950">Recent Inquiries</h2>
              <p className="text-xs text-gray-500">Customer leads sent to providers</p>
            </div>
            <Link
              href="/admin/inquiries"
              className="text-xs font-semibold text-[#155761] hover:text-[#10474F] flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recent.inquiries.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No inquiries received yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recent.inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/inquiries/${inq.id}`}
                      className="font-semibold text-gray-900 hover:text-[#155761] truncate block"
                    >
                      {inq.name}
                    </Link>
                    <div className="text-gray-500 text-[11px] truncate">
                      Project: {inq.project.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <InquiryStatusBadge status={inq.status} />
                    <Link
                      href={`/admin/inquiries/${inq.id}`}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Custom Requests Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-950">
                Recent Custom Requests
              </h2>
              <p className="text-xs text-gray-500">Bespoke software project scopes</p>
            </div>
            <Link
              href="/admin/custom-requests"
              className="text-xs font-semibold text-[#155761] hover:text-[#10474F] flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recent.requests.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">
              No custom requests received yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recent.requests.map((req) => (
                <div
                  key={req.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/custom-requests/${req.id}`}
                      className="font-semibold text-gray-900 hover:text-[#155761] truncate block"
                    >
                      {req.projectTitle}
                    </Link>
                    <div className="text-gray-500 text-[11px] truncate">
                      From: {req.name} {req.budget ? `• Budget: ${req.budget}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <RequestStatusBadge status={req.status} />
                    <Link
                      href={`/admin/custom-requests/${req.id}`}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Audit Trail Card ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#155761]" />
            <h2 className="text-base font-bold text-gray-950">Recent Audit Trail</h2>
          </div>
          <Link
            href="/admin/audit-logs"
            className="text-xs font-semibold text-[#155761] hover:text-[#10474F] flex items-center gap-1"
          >
            <span>Full Audit Log</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recent.auditLogs.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">
            No audit log entries recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 text-xs">
            {recent.auditLogs.map((log) => {
              const formattedTime = new Date(log.createdAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              });

              return (
                <div
                  key={log.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-mono text-[11px] font-semibold">
                      {log.action}
                    </span>
                    <span className="text-gray-500">on {log.entityType}</span>
                    {log.entityId && (
                      <span className="text-gray-400 font-mono text-[10px]">
                        ID: {log.entityId}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-[11px] shrink-0">
                    {formattedTime}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
