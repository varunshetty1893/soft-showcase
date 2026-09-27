// components/projects/RelatedProjects.tsx
import * as React from "react";
import { ProjectCard, type ProjectCardData } from "./ProjectCard";

interface RelatedProjectsProps {
  projects: ProjectCardData[];
}

export function RelatedProjects({ projects }: RelatedProjectsProps) {
  if (!projects || projects.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-gray-200">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">
        Similar Software Projects
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}
