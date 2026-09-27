"use client";
// components/admin/ProjectTable.tsx
// Admin table for listing, filtering, and managing projects.

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
    DRAFT: "bg-yellow-900/40 text-yellow-400 border-yellow-800/50",
    PUBLISHED: "bg-green-900/40 text-green-400 border-green-800/50",
    ARCHIVED: "bg-gray-800 text-gray-500 border-gray-700",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
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
      if (!res.ok) throw new Error("Failed to fetch projects");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Failed to load projects. Please try again.");
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
      const res = await fetch(`/api/admin/projects/${archivingId}`, {
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or slug…"
          className="flex-1 bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Project</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Provider</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Featured</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-3" colSpan={6}>
                    <div className="h-4 bg-gray-800 rounded w-3/4" />
                  </td>
                </tr>
              ))
            ) : data?.projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  {search || statusFilter
                    ? "No projects match your filters."
                    : "No projects yet. Create your first project."}
                </td>
              </tr>
            ) : (
              data?.projects.map((project) => (
                <tr
                  key={project.id}
                  className="bg-gray-950 hover:bg-gray-900 transition-colors"
                >
                  {/* Project */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {project.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={project.images[0].url}
                          alt={project.title}
                          className="w-10 h-10 rounded object-cover shrink-0 bg-gray-800"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center shrink-0">
                          <span className="text-gray-600 text-lg">📦</span>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-100 font-medium line-clamp-1">
                          {project.title}
                        </p>
                        <p className="text-gray-500 text-xs">/projects/{project.slug}</p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-gray-400">{project.category.name}</td>

                  {/* Provider */}
                  <td className="px-4 py-3 text-gray-400">{project.provider.displayName}</td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={project.status} />
                  </td>

                  {/* Featured */}
                  <td className="px-4 py-3">
                    {project.featured ? (
                      <span className="text-yellow-400" title="Featured">★</span>
                    ) : (
                      <span className="text-gray-700">—</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {project.status === "PUBLISHED" && (
                        <Link
                          href={`/projects/${project.slug}`}
                          target="_blank"
                          className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-2 py-1 rounded transition"
                        >
                          View
                        </Link>
                      )}
                      <Link
                        href={`/admin/projects/${project.id}/edit`}
                        className="text-xs text-blue-400 hover:text-blue-300 border border-blue-900/50 hover:border-blue-700 px-2 py-1 rounded transition"
                      >
                        Edit
                      </Link>
                      {project.status !== "ARCHIVED" && (
                        <button
                          onClick={() => {
                            setArchivingId(project.id);
                            setArchivingTitle(project.title);
                          }}
                          className="text-xs text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-800 px-2 py-1 rounded transition"
                        >
                          Archive
                        </button>
                      )}
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
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, data.total)} of{" "}
            {data.total} projects
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border border-gray-700 rounded hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ← Prev
            </button>
            <button
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border border-gray-700 rounded hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Archive confirmation modal */}
      {archivingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Archive Project</h3>
            <p className="text-sm text-gray-400 mb-6">
              Archive <span className="text-white font-medium">{archivingTitle}</span>?{" "}
              The project will no longer be visible to visitors. Existing inquiries are preserved.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setArchivingId(null)}
                className="px-4 py-2 text-sm border border-gray-700 text-gray-300 hover:border-gray-500 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmArchive}
                className="px-4 py-2 text-sm bg-red-700 hover:bg-red-600 text-white rounded-lg transition"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
