"use client";
// components/admin/AuditLogsView.tsx
// Interactive client view for /admin/audit-logs (Phase 5):
// - URL search-param driven search (debounced, max 100 chars) & filters with useTransition
// - Multi-select Action and Entity Type filters, Actor filter (Admins + "System"),
//   inclusive IST date range (from / to), Sort (newest / oldest), Page size (25 / 50 / 100)
// - Active filter chips + "Clear all", result summary ("Showing X–Y of Z matches")
// - Readable Actor (name + email / "System" / "Deleted user") and Entity (human label + admin link)
// - Colour-coded Action badges by category
// - Pretty-printed redacted JSON payload viewer with Copy button
// - CSV export of the current filtered set (capped at 10,000 rows)

import React, { useState, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  History,
  Search,
  Filter,
  Download,
  X,
  Copy,
  Check,
  ExternalLink,
  Shield,
  Bot,
  UserX,
  Calendar,
  ArrowUpDown,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type {
  AuditLogFilterState,
  AuditFilterOptions,
  AuditActionCategory,
  AuditPageSize,
} from "@/lib/db/audit";

export interface SerializedAuditLogRow {
  id: string;
  userId: string | null;
  action: string;
  actionCategory: AuditActionCategory;
  entityType: string;
  entityId: string | null;
  details: unknown;
  createdAtIso: string;
  actor: {
    id: string | null;
    status: "system" | "resolved" | "deleted";
    name: string | null;
    email: string | null;
    displayLabel: string;
  };
  entity: {
    entityType: string;
    entityId: string | null;
    label: string | null;
    href: string | null;
  };
}

interface AuditLogsViewProps {
  logs: SerializedAuditLogRow[];
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: AuditPageSize;
  filters: AuditLogFilterState;
  filterOptions: AuditFilterOptions;
}

function getActionBadgeStyle(category: AuditActionCategory): string {
  if (category === "created_approved") {
    return "bg-emerald-50 text-emerald-800 border-emerald-200";
  }
  if (category === "rejected_deleted") {
    return "bg-rose-50 text-rose-800 border-rose-200";
  }
  return "bg-[#F3F7F7] text-[#155761] border-[#BEDEE1]";
}

function buildSearchParamsString(
  next: Partial<AuditLogFilterState>,
  base: AuditLogFilterState
): string {
  const merged: AuditLogFilterState = {
    ...base,
    ...next,
  };

  const sp = new URLSearchParams();
  if (merged.q.trim()) {
    sp.set("q", merged.q.trim().slice(0, 100));
  }
  for (const act of merged.actions) {
    if (act) sp.append("action", act);
  }
  for (const et of merged.entityTypes) {
    if (et) sp.append("entityType", et);
  }
  if (merged.actor) {
    sp.set("actor", merged.actor);
  }
  if (merged.from) {
    sp.set("from", merged.from);
  }
  if (merged.to) {
    sp.set("to", merged.to);
  }
  if (merged.sort && merged.sort !== "newest") {
    sp.set("sort", merged.sort);
  }
  if (merged.pageSize && merged.pageSize !== 25) {
    sp.set("pageSize", String(merged.pageSize));
  }
  if (merged.page && merged.page > 1) {
    sp.set("page", String(merged.page));
  }

  return sp.toString();
}

export default function AuditLogsView({
  logs,
  total,
  totalPages,
  currentPage,
  pageSize,
  filters,
  filterOptions,
}: AuditLogsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(filters.q);
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const [entityDropdownOpen, setEntityDropdownOpen] = useState(false);
  const [copiedRowId, setCopiedRowId] = useState<string | null>(null);

  // Sync local search input when URL changes via Back/Forward or "Clear all"
  useEffect(() => {
    setSearchInput(filters.q);
  }, [filters.q]);

  const applyFilters = useCallback(
    (patch: Partial<AuditLogFilterState>, resetPage = true) => {
      const targetPage = resetPage ? 1 : patch.page ?? filters.page;
      const qs = buildSearchParamsString({ ...patch, page: targetPage }, filters);
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [filters, pathname, router]
  );

  // Debounce text input `q` (300ms)
  useEffect(() => {
    const trimmed = searchInput.trim().slice(0, 100);
    if (trimmed === filters.q.trim()) return;

    const timer = setTimeout(() => {
      applyFilters({ q: trimmed }, true);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters.q, applyFilters]);

  function toggleMultiAction(act: string) {
    const exists = filters.actions.includes(act);
    const nextActions = exists
      ? filters.actions.filter((a) => a !== act)
      : [...filters.actions, act];
    applyFilters({ actions: nextActions }, true);
  }

  function toggleMultiEntityType(et: string) {
    const exists = filters.entityTypes.includes(et);
    const nextEntityTypes = exists
      ? filters.entityTypes.filter((e) => e !== et)
      : [...filters.entityTypes, et];
    applyFilters({ entityTypes: nextEntityTypes }, true);
  }

  function handleClearAll() {
    setSearchInput("");
    startTransition(() => {
      router.push(pathname);
    });
  }

  async function handleCopyPayload(id: string, details: unknown) {
    try {
      const pretty = JSON.stringify(details, null, 2);
      await navigator.clipboard.writeText(pretty);
      setCopiedRowId(id);
      toast.success("Payload JSON copied to clipboard.");
      setTimeout(() => {
        setCopiedRowId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch {
      toast.error("Could not copy payload to clipboard.");
    }
  }

  const hasActiveFilters = Boolean(
    filters.q ||
      filters.actions.length > 0 ||
      filters.entityTypes.length > 0 ||
      filters.actor ||
      filters.from ||
      filters.to ||
      filters.sort !== "newest"
  );

  const startIdx = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIdx = total === 0 ? 0 : Math.min(currentPage * pageSize, total);

  const exportQueryString = buildSearchParamsString({ page: 1 }, filters);
  const exportHref = `/api/admin/audit-logs/export${
    exportQueryString ? `?${exportQueryString}` : ""
  }`;

  const selectedActorOption = filterOptions.actors.find(
    (a) => a.id === filters.actor
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-950 flex items-center gap-2">
            <History className="w-6 h-6 text-[#155761]" />
            <span>Audit Trail &amp; Activity Logs</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Immutable, append-only record of administrative actions, moderation decisions, and workflow transitions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <a
            href={exportHref}
            download
            data-testid="audit-export-csv-btn"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "gap-1.5 text-xs font-semibold h-9",
            })}
          >
            <Download className="w-3.5 h-3.5 text-[#155761]" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input q (max 100 chars) */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              maxLength={100}
              onChange={(e) => setSearchInput(e.target.value.slice(0, 100))}
              placeholder="Search action, entity, actor name/email, or payload…"
              data-testid="audit-search-input"
              className="w-full h-9 pl-9 pr-8 rounded-xl border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#155761]"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  applyFilters({ q: "" }, true);
                }}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Multi-select Action Filter */}
          <div className="md:col-span-2 relative">
            <button
              type="button"
              onClick={() => {
                setActionDropdownOpen((v) => !v);
                setEntityDropdownOpen(false);
              }}
              data-testid="audit-action-filter-btn"
              className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 flex items-center justify-between gap-1 hover:bg-gray-50 cursor-pointer"
            >
              <span className="truncate font-medium">
                {filters.actions.length === 0
                  ? "All Actions"
                  : `${filters.actions.length} Action${
                      filters.actions.length > 1 ? "s" : ""
                    }`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            </button>

            {actionDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-64 max-h-64 overflow-y-auto rounded-xl bg-white border border-gray-200 shadow-xl z-30 p-2 space-y-1">
                <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100">
                  <span className="text-[11px] font-bold text-gray-600">
                    Filter by Action
                  </span>
                  {filters.actions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => applyFilters({ actions: [] }, true)}
                      className="text-[11px] text-[#155761] hover:underline font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {filterOptions.distinctActions.length === 0 ? (
                  <p className="text-xs text-gray-400 px-2 py-2">No actions recorded</p>
                ) : (
                  filterOptions.distinctActions.map((act) => {
                    const checked = filters.actions.includes(act);
                    return (
                      <label
                        key={act}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-xs text-gray-800"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleMultiAction(act)}
                          className="rounded border-gray-300 text-[#155761] focus:ring-[#155761]"
                        />
                        <span className="font-mono text-[11px] truncate">{act}</span>
                      </label>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Multi-select Entity Type Filter */}
          <div className="md:col-span-2 relative">
            <button
              type="button"
              onClick={() => {
                setEntityDropdownOpen((v) => !v);
                setActionDropdownOpen(false);
              }}
              data-testid="audit-entity-filter-btn"
              className="w-full h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 flex items-center justify-between gap-1 hover:bg-gray-50 cursor-pointer"
            >
              <span className="truncate font-medium">
                {filters.entityTypes.length === 0
                  ? "All Entities"
                  : `${filters.entityTypes.length} Entit${
                      filters.entityTypes.length > 1 ? "ies" : "y"
                    }`}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            </button>

            {entityDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-56 max-h-60 overflow-y-auto rounded-xl bg-white border border-gray-200 shadow-xl z-30 p-2 space-y-1">
                <div className="flex items-center justify-between px-2 py-1 border-b border-gray-100">
                  <span className="text-[11px] font-bold text-gray-600">
                    Filter by Entity Type
                  </span>
                  {filters.entityTypes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => applyFilters({ entityTypes: [] }, true)}
                      className="text-[11px] text-[#155761] hover:underline font-semibold cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {filterOptions.distinctEntityTypes.map((et) => {
                  const checked = filters.entityTypes.includes(et);
                  return (
                    <label
                      key={et}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-xs text-gray-800"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMultiEntityType(et)}
                        className="rounded border-gray-300 text-[#155761] focus:ring-[#155761]"
                      />
                      <span className="truncate font-medium">{et}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actor Select (Admins + System) */}
          <div className="md:col-span-2">
            <select
              aria-label="Filter by Actor"
              data-testid="audit-actor-select"
              value={filters.actor}
              onChange={(e) => applyFilters({ actor: e.target.value }, true)}
              className="w-full h-9 px-2.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#155761]"
            >
              <option value="">All Actors</option>
              {filterOptions.actors.map((actorOpt) => (
                <option key={actorOpt.id} value={actorOpt.id}>
                  {actorOpt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort & Page Size */}
          <div className="md:col-span-2 flex items-center gap-2">
            <select
              aria-label="Sort order"
              data-testid="audit-sort-select"
              value={filters.sort}
              onChange={(e) =>
                applyFilters(
                  { sort: e.target.value as "newest" | "oldest" },
                  true
                )
              }
              className="w-1/2 h-9 px-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#155761]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>

            <select
              aria-label="Rows per page"
              data-testid="audit-pagesize-select"
              value={pageSize}
              onChange={(e) =>
                applyFilters(
                  { pageSize: Number(e.target.value) as AuditPageSize },
                  true
                )
              }
              className="w-1/2 h-9 px-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#155761]"
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>

        {/* Second Row: Inclusive IST Date Bounds */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1 font-semibold text-gray-700">
              <Calendar className="w-3.5 h-3.5 text-[#155761]" />
              <span>Date Range (IST):</span>
            </span>
            <label className="inline-flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500">From</span>
              <input
                type="date"
                aria-label="From date (IST)"
                data-testid="audit-date-from"
                value={filters.from}
                onChange={(e) => applyFilters({ from: e.target.value }, true)}
                className="h-8 px-2.5 rounded-lg border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#155761]"
              />
            </label>
            <label className="inline-flex items-center gap-1.5">
              <span className="text-[11px] text-gray-500">To</span>
              <input
                type="date"
                aria-label="To date (IST)"
                data-testid="audit-date-to"
                value={filters.to}
                onChange={(e) => applyFilters({ to: e.target.value }, true)}
                className="h-8 px-2.5 rounded-lg border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#155761]"
              />
            </label>
          </div>

          {/* Result Summary ("Showing 1–25 of 140 matches") */}
          <div
            className="flex items-center gap-2 text-xs font-medium text-gray-600"
            data-testid="audit-result-summary"
          >
            {isPending && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#155761]" />
            )}
            <span>
              Showing <strong className="text-gray-900">{startIdx}</strong>–
              <strong className="text-gray-900">{endIdx}</strong> of{" "}
              <strong className="text-gray-900">{total}</strong>{" "}
              {total === 1 ? "match" : "matches"}
            </span>
          </div>
        </div>

        {/* Active Filter Chips & "Clear all" */}
        {hasActiveFilters && (
          <div
            className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-gray-100"
            data-testid="audit-active-filter-chips"
          >
            <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3" />
              Active filters:
            </span>

            {filters.q && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F3F7F7] text-[#155761] border border-[#BEDEE1]">
                <span>Search: &ldquo;{filters.q}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    applyFilters({ q: "" }, true);
                  }}
                  className="hover:text-gray-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.actions.map((act) => (
              <span
                key={`chip-act-${act}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-[#F3F7F7] text-[#155761] border border-[#BEDEE1]"
              >
                <span>Action: {act}</span>
                <button
                  type="button"
                  onClick={() => toggleMultiAction(act)}
                  className="hover:text-gray-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {filters.entityTypes.map((et) => (
              <span
                key={`chip-et-${et}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F3F7F7] text-[#155761] border border-[#BEDEE1]"
              >
                <span>Entity: {et}</span>
                <button
                  type="button"
                  onClick={() => toggleMultiEntityType(et)}
                  className="hover:text-gray-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {filters.actor && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F3F7F7] text-[#155761] border border-[#BEDEE1]">
                <span>
                  Actor: {selectedActorOption?.label || filters.actor}
                </span>
                <button
                  type="button"
                  onClick={() => applyFilters({ actor: "" }, true)}
                  className="hover:text-gray-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.from && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F3F7F7] text-[#155761] border border-[#BEDEE1]">
                <span>From: {filters.from} (IST)</span>
                <button
                  type="button"
                  onClick={() => applyFilters({ from: "" }, true)}
                  className="hover:text-gray-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.to && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F3F7F7] text-[#155761] border border-[#BEDEE1]">
                <span>To: {filters.to} (IST)</span>
                <button
                  type="button"
                  onClick={() => applyFilters({ to: "" }, true)}
                  className="hover:text-gray-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.sort !== "newest" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#F3F7F7] text-[#155761] border border-[#BEDEE1]">
                <ArrowUpDown className="w-3 h-3" />
                <span>Sort: Oldest first</span>
                <button
                  type="button"
                  onClick={() => applyFilters({ sort: "newest" }, true)}
                  className="hover:text-gray-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={handleClearAll}
              data-testid="audit-clear-all-btn"
              className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:underline ml-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-500 space-y-3">
            <History className="w-9 h-9 text-gray-400 mx-auto" />
            <div>
              <p className="font-semibold text-gray-900">
                No audit log entries match your current filters
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {hasActiveFilters
                  ? "Try broadening your search query or clearing active filter chips."
                  : "Actions performed by administrators and system workflows will appear here chronologically."}
              </p>
            </div>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-xs"
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/75 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Timestamp (IST)</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Admin / Actor</th>
                  <th className="py-3 px-4">Payload / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const formattedIst = new Date(log.createdAtIso).toLocaleString(
                    "en-IN",
                    {
                      timeZone: "Asia/Kolkata",
                      dateStyle: "medium",
                      timeStyle: "medium",
                    }
                  );

                  const prettyPayload = log.details
                    ? JSON.stringify(log.details, null, 2)
                    : null;

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50/60 transition-colors align-top"
                    >
                      {/* Timestamp */}
                      <td
                        className="py-3 px-4 text-gray-600 whitespace-nowrap font-mono text-[11px]"
                        title={`UTC: ${log.createdAtIso}`}
                      >
                        {formattedIst}
                      </td>

                      {/* Colour-coded Action Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md border font-mono text-[11px] font-semibold ${getActionBadgeStyle(
                            log.actionCategory
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Readable Entity with Admin Link */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-1.5 py-0.2 rounded bg-gray-100 text-gray-700 font-semibold text-[10px] border border-gray-200">
                              {log.entity.entityType}
                            </span>
                            {log.entity.label ? (
                              log.entity.href ? (
                                <Link
                                  href={log.entity.href}
                                  className="font-bold text-[#155761] hover:underline inline-flex items-center gap-1 text-xs"
                                >
                                  <span>{log.entity.label}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0" />
                                </Link>
                              ) : (
                                <span className="font-bold text-gray-900 text-xs">
                                  {log.entity.label}
                                </span>
                              )
                            ) : null}
                          </div>
                          {log.entity.entityId && (
                            <div className="text-gray-400 font-mono text-[10px]">
                              ID: {log.entity.entityId}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Readable Actor (Name + Email / System / Deleted user) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.actor.status === "system" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200 text-[11px] font-medium">
                            <Bot className="w-3 h-3 text-gray-500" />
                            <span>System</span>
                          </span>
                        ) : log.actor.status === "deleted" ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                              <UserX className="w-3 h-3 text-amber-600" />
                              <span>Deleted user</span>
                            </span>
                            {log.actor.id && (
                              <div className="text-[10px] text-gray-400 font-mono">
                                {log.actor.id}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="inline-flex items-center gap-1 font-semibold text-gray-900 text-xs">
                              <Shield className="w-3 h-3 text-[#155761] shrink-0" />
                              <span>{log.actor.name || log.actor.email}</span>
                            </div>
                            {log.actor.email && log.actor.name && (
                              <div className="text-[11px] text-gray-500">
                                {log.actor.email}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Payload Viewer with Pretty JSON & Copy Button */}
                      <td className="py-3 px-4 max-w-md">
                        {prettyPayload ? (
                          <details className="group">
                            <summary className="text-[11px] text-[#155761] hover:text-[#10474F] font-semibold cursor-pointer select-none inline-flex items-center gap-1">
                              <span>View Payload</span>
                            </summary>
                            <div className="mt-1.5 relative rounded-xl bg-gray-900 text-gray-100 p-2.5 border border-gray-800">
                              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-gray-800">
                                <span className="text-[10px] font-mono text-gray-400">
                                  JSON Payload (Redacted)
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopyPayload(log.id, log.details)
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-medium cursor-pointer transition"
                                >
                                  {copiedRowId === log.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy JSON</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <pre className="text-[10px] font-mono overflow-x-auto max-h-44 leading-relaxed">
                                {prettyPayload}
                              </pre>
                            </div>
                          </details>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer (Preserves all filters & pageSize) */}
        {total > 0 && (
          <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <span>
              Page <strong className="text-gray-900">{currentPage}</strong> of{" "}
              <strong className="text-gray-900">{totalPages}</strong> (Showing{" "}
              {startIdx}–{endIdx} of {total} matches)
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage <= 1 || isPending}
                onClick={() =>
                  applyFilters({ page: Math.max(1, currentPage - 1) }, false)
                }
                className="h-8 text-xs"
              >
                ← Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages || isPending}
                onClick={() =>
                  applyFilters(
                    { page: Math.min(totalPages, currentPage + 1) },
                    false
                  )
                }
                className="h-8 text-xs"
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
