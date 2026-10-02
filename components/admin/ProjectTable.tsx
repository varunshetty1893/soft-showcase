"use client";
// components/admin/ProjectTable.tsx
// Admin table for listing, filtering, and managing projects styled to match Soft Showcase.

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, ExternalLink, Edit3, Archive, Trash2, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProjectRow = {
  id: string;
  title: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  priceMode: string;
  price: string | null;
  createdAt: string;
  category: { id: string; name: string };
  provider: { id: string; displayName: string };
  images: { url: string }[];
};

type PaginatedProjects = {
  projects: ProjectRow[];
  total: number;
  totalPages: number;
  currentPage: number;
};

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ProjectRow["status"] }) {
  const styles: Record<ProjectRow["status"], string> = {
    DRAFT: "bg-amber-50 text-amber-800 border-amber-200",
    PUBLISHED: "bg-[#DDF4EC] text-[#2F7D78] border-[#2F7D78]/25",
    ARCHIVED: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border ${styles[status]}`}
    >
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProjectTable() {
  const router = useRouter();

  const [data, setData] = useState<PaginatedProjects | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);

  // Archive confirmation
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [archivingTitle, setArchivingTitle] = useState<string>("");

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingTitle, setDeletingTitle] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Quick toggle featured status
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);
  const [togglingStatusId, setTogglingStatusId] = useState<string | null>(null);

  async function handleQuickPublish(project: ProjectRow) {
    const nextStatus = project.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    setTogglingStatusId(project.id);
    setError(null);

    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === project.id ? { ...p, status: nextStatus } : p
        ),
      };
    });

    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to update project status");
      }
      router.refresh();
    } catch (err: unknown) {
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          projects: prev.projects.map((p) =>
            p.id === project.id ? { ...p, status: project.status } : p
          ),
        };
      });
      setError(
        err instanceof Error ? err.message : "Failed to update project status"
      );
    } finally {
      setTogglingStatusId(null);
    }
  }

  async function handleToggleFeatured(project: ProjectRow) {
    const nextFeatured = !project.featured;
    setTogglingFeaturedId(project.id);

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === project.id ? { ...p, featured: nextFeatured } : p
        ),
      };
    });

    try {
      const res = await fetch(`/api/admin/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: nextFeatured }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to update featured status");
      }
    } catch (err: unknown) {
      // Revert optimistic update on failure
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          projects: prev.projects.map((p) =>
            p.id === project.id ? { ...p, featured: project.featured } : p
          ),
        };
      });
      setError(
        err instanceof Error ? err.message : "Failed to toggle featured status"
      );
    } finally {
      setTogglingFeaturedId(null);
    }
  }

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/projects?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to fetch projects");
      }
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load projects. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // ── Archive ────────────────────────────────────────────────────────────────

  async function confirmArchive() {
    if (!archivingId) return;
    try {
      const res = await fetch(`/api/admin/projects/${archivingId}?action=archive`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to archive");
      setArchivingId(null);
      fetchProjects();
      router.refresh();
    } catch {
      setError("Failed to archive project. Please try again.");
      setArchivingId(null);
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async function confirmDelete() {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/projects/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to delete project");
      }
      setDeletingId(null);
      fetchProjects();
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete project. Please try again."
      );
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#526267] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or slug…"
            className="w-full bg-white border border-[#D9E2E4] text-[#102124] rounded-xl pl-9 pr-3.5 py-2 text-sm focus:outline-none focus:border-[#155761] focus:ring-1 focus:ring-[#155761] placeholder:text-[#526267]/60 shadow-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-[#D9E2E4] text-[#102124] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#155761] focus:ring-1 focus:ring-[#155761] shadow-xs cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-4 py-3 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Failed to load projects</span>
            <span className="text-rose-600">{error}</span>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="overflow-x-auto rounded-2xl border border-[#D9E2E4] bg-white shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#F8FAFA] text-[#526267] text-[11px] uppercase tracking-wider font-semibold border-b border-[#D9E2E4]">
            <tr>
              <th className="px-4 py-3.5">Project</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Provider</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 text-center">Featured</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F7F7]">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4" colSpan={6}>
                    <div className="h-4 bg-[#EEF3F4] rounded-md w-2/3" />
                  </td>
                </tr>
              ))
            ) : data?.projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[#526267]">
                  {search || statusFilter
                    ? "No projects match your filter criteria."
                    : "No software projects found. Create your first project."}
                </td>
              </tr>
            ) : (
              data?.projects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-[#F8FAFA] transition-colors"
                >
                  {/* Project */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      {project.images[0] ? (
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-[#D9E2E4]">
                          <Image
                            src={project.images[0].url}
                            alt={project.title}
                            fill
                            sizes="40px"
                            className="object-cover"
                            referrerPolicy="no-referrer"
                            unoptimized={project.images[0].url.startsWith("data:")}
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] flex items-center justify-center shrink-0 font-semibold text-xs">
                          App
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/admin/projects/${project.id}/edit`}
                          className="text-[#102124] font-bold hover:text-[#155761] transition-colors line-clamp-1 text-sm"
                        >
                          {project.title}
                        </Link>
                        <p className="text-[#526267] text-[11px] font-mono mt-0.5">
                          /projects/{project.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3.5 text-[#102124] font-medium">
                    <span className="px-2 py-0.5 bg-[#F3F7F7] rounded-md text-[11px] border border-[#D9E2E4]">
                      {project.category.name}
                    </span>
                  </td>

                  {/* Provider */}
                  <td className="px-4 py-3.5 text-[#526267]">
                    <span className="font-semibold text-[#102124]">
                      {project.provider.displayName}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <StatusBadge status={project.status} />
                  </td>

                  {/* Featured Toggle Button */}
                  <td className="px-4 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(project)}
                      disabled={togglingFeaturedId === project.id}
                      title={
                        project.featured
                          ? "Featured on homepage & catalog. Click to unfeature."
                          : "Not featured. Click to mark as featured."
                      }
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                        project.featured
                          ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs"
                          : "bg-gray-50 hover:bg-emerald-50 text-gray-400 hover:text-emerald-700 border border-dashed border-gray-300 hover:border-emerald-300"
                      }`}
                    >
                      {togglingFeaturedId === project.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                      ) : project.featured ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                          <span>Featured</span>
                        </>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px]">
                          <span className="text-gray-400 group-hover:text-emerald-500">+</span>
                          <span>Feature</span>
                        </span>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {project.status !== "PUBLISHED" && (
                        <button
                          type="button"
                          onClick={() => handleQuickPublish(project)}
                          disabled={togglingStatusId === project.id}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#2F7D78] hover:bg-[#24635F] border border-[#2F7D78] px-2.5 py-1 rounded-lg transition cursor-pointer shadow-2xs"
                        >
                          {togglingStatusId === project.id ? "Publishing…" : "Publish"}
                        </button>
                      )}
                      {project.status === "PUBLISHED" && (
                        <Link
                          href={`/projects/${project.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] text-[#526267] hover:text-[#155761] border border-[#D9E2E4] hover:bg-[#F3F7F7] px-2 py-1 rounded-lg transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </Link>
                      )}
                      <Link
                        href={`/admin/projects/${project.id}/edit`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#155761] hover:text-[#10474F] border border-[#155761]/30 hover:bg-[#F3F7F7] px-2.5 py-1 rounded-lg transition"
                      >
                        <Edit3 className="w-3 h-3" />
                        Edit
                      </Link>
                      {project.status !== "ARCHIVED" && (
                        <button
                          type="button"
                          onClick={() => {
                            setArchivingId(project.id);
                            setArchivingTitle(project.title);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-amber-800 hover:text-amber-900 border border-amber-200 hover:bg-amber-50 px-2 py-1 rounded-lg transition cursor-pointer"
                        >
                          <Archive className="w-3 h-3" />
                          Archive
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingId(project.id);
                          setDeletingTitle(project.title);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-rose-700 hover:text-white border border-rose-200 hover:border-rose-600 hover:bg-rose-600 px-2 py-1 rounded-lg transition cursor-pointer font-medium"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[#526267] pt-2">
          <span>
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of{" "}
            {data.total} projects
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-xs h-8"
            >
              ← Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs h-8"
            >
              Next →
            </Button>
          </div>
        </div>
      )}

      {/* Archive confirmation modal */}
      {archivingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#D9E2E4] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-base font-bold text-[#102124] mb-2">Archive Project</h3>
            <p className="text-xs text-[#526267] mb-6 leading-relaxed">
              Are you sure you want to archive <strong className="text-[#102124] font-semibold">{archivingTitle}</strong>?{" "}
              The project will no longer be visible on the public showcase catalog. Existing inquiries remain preserved.
            </p>
            <div className="flex gap-2.5 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArchivingId(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmArchive}
                className="text-xs"
              >
                Archive Project
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#D9E2E4] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-base font-bold text-rose-700 mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              Delete Project
            </h3>
            <p className="text-xs text-[#526267] mb-6 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[#102124] font-semibold">{deletingTitle}</strong>?{" "}
              This action cannot be undone. All project screenshots, specifications, features, and inquiries will be permanently removed.
            </p>
            <div className="flex gap-2.5 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="text-xs"
              >
                {isDeleting ? "Deleting…" : "Permanently Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
