// app/admin/projects/new/page.tsx
// Admin: create a new project.

import ProjectForm from "@/components/admin/ProjectForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Project — Admin | Soft Showcase",
};

export default function NewProjectPage() {
  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#102124]">
          Create New Project
        </h1>
        <p className="text-sm text-[#526267] mt-1">
          Fill in all required fields. The project is saved as Draft until you publish it.
        </p>
      </div>

      {/* Form */}
      <ProjectForm />
    </div>
  );
}
