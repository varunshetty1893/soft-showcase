// app/admin/projects/new/page.tsx
// Admin: create a new project.

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProjectForm from "@/components/admin/ProjectForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Project — Admin | Soft Showcase",
};

export default function NewProjectPage() {
  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#D9E2E4]">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/projects"
            className="p-2 rounded-xl bg-white border border-[#D9E2E4] hover:bg-[#F3F7F7] text-[#526267] transition-colors shrink-0"
            aria-label="Back to Projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#102124]">
              Create New Project
            </h1>
            <p className="text-sm text-[#526267] mt-1">
              Fill in all required fields. The project is saved as Draft until you publish it.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <ProjectForm />
    </div>
  );
}
