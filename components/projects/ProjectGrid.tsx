// components/projects/ProjectGrid.tsx
import * as React from "react";
import Link from "next/link";
import { FolderSearch, PlusCircle, Search } from "lucide-react";
import { ProjectCard, type ProjectCardData } from "./ProjectCard";
import { buttonVariants } from "@/components/ui/button";

interface ProjectGridProps {
  projects: ProjectCardData[];
  searchQuery?: string;
  relatedSearches?: string[];
  suggestedProjects?: ProjectCardData[];
}

export function ProjectGrid({
  projects,
  searchQuery,
  relatedSearches = [],
  suggestedProjects = [],
}: ProjectGridProps) {
  const cleanQuery = (searchQuery || "").trim();

  if (projects.length === 0) {
    return (
      <div className="space-y-10">
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-8 sm:p-12 text-center max-w-xl mx-auto my-6 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center mx-auto mb-4 text-[#155761]">
            <FolderSearch className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#102124]">
            {cleanQuery
              ? `No exact matches for "${cleanQuery}"`
              : "No Projects Found"}
          </h3>
          <p className="mt-2 text-sm text-[#526267] leading-relaxed">
            {cleanQuery
              ? "We couldn’t find any software projects matching that exact query. Try one of the related searches below, clear active filters, or request a custom build."
              : "We couldn’t find any software projects matching your active filters. Try clearing some filters, or request a custom build."}
          </p>

          {relatedSearches.length > 0 && (
            <div className="mt-6 pt-5 border-t border-[#F3F7F7]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#526267] mb-3">
                Related Searches
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {relatedSearches.map((term) => (
                  <Link
                    key={term}
                    href={`/projects?q=${encodeURIComponent(term)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F8FAFA] hover:bg-[#F3F7F7] border border-[#D9E2E4] hover:border-[#155761]/40 text-xs font-medium text-[#102124] hover:text-[#155761] transition-colors"
                  >
                    <Search className="w-3 h-3 text-[#155761]" />
                    <span>{term}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/projects"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Clear All Filters
            </Link>
            <Link
              href="/custom-project"
              className={buttonVariants({
                variant: "primary",
                size: "sm",
                className: "gap-1.5",
              })}
            >
              <PlusCircle className="w-4 h-4" />
              Request Custom Build
            </Link>
          </div>
        </div>

        {suggestedProjects.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-[#102124]">
                Related Projects Across Other Categories
              </h4>
              <Link
                href={`/projects?q=${encodeURIComponent(cleanQuery)}`}
                className="text-xs font-semibold text-[#155761] hover:underline"
              >
                Search all categories →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {suggestedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
