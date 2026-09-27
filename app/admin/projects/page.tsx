// app/admin/projects/page.tsx
// Admin: project list page with table and "New Project" button.

import Link from "next/link";
import ProjectTable from "@/components/admin/ProjectTable";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects — Admin | Soft Showcase",
};

export default function AdminProjectsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage all projects across statuses.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/projects/import"
            className="px-4 py-2 text-sm border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white rounded-lg transition"
          >
            Import JSON
          </Link>
          <Link
            href="/admin/projects/new"
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            + New Project
          </Link>
        </div>
      </div>

      {/* Table */}
      <ProjectTable />
    </div>
  );
}
