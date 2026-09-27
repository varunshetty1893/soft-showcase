// components/projects/ProjectGrid.tsx
import * as React from "react";
import Link from "next/link";
import { FolderSearch, PlusCircle } from "lucide-react";
import { ProjectCard, type ProjectCardData } from "./ProjectCard";
import { Button } from "@/components/ui/button";

interface ProjectGridProps {
  projects: ProjectCardData[];
}

export function ProjectGrid({ projects }: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-12 shadow-xs">
        <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">
          <FolderSearch className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">No Projects Found</h3>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          We couldn’t find any software projects matching your active search or filters.
          Try clearing some filters, or request a custom build.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <Link href="/projects">
            <Button variant="outline" size="sm">
              Clear All Filters
            </Button>
          </Link>
          <Link href="/custom-project">
            <Button variant="primary" size="sm" className="gap-1.5">
              <PlusCircle className="w-4 h-4" />
              Request Custom Build
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
