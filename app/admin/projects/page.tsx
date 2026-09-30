// app/admin/projects/page.tsx
// Admin: project list page with table and "New Project" button.

import Link from "next/link";
import ProjectTable from "@/components/admin/ProjectTable";
import type { Metadata } from "next";
import { PlusCircle, UploadCloud } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Projects — Admin | Soft Showcase",
};

export default function AdminProjectsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#102124]">
            Projects Catalog
          </h1>
          <p className="text-sm text-[#526267] mt-1">
            Manage, publish, and curate software projects across all categories.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/admin/projects/import" className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 text-xs text-[#155761] border-[#D9E2E4] hover:bg-[#F3F7F7]" })}>
              <UploadCloud className="w-3.5 h-3.5 text-[#155761]" />
              Import JSON
            </Link>
          <Link href="/admin/projects/new" className={buttonVariants({ variant: "primary", size: "sm", className: "gap-1.5 text-xs shadow-xs" })}>
              <PlusCircle className="w-3.5 h-3.5" />
              New Project
            </Link>
        </div>
      </div>

      {/* Table */}
      <ProjectTable />
    </div>
  );
}
