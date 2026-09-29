import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProjectCard, type ProjectCardData } from "@/components/projects/ProjectCard";

interface FeaturedSectionProps {
  featuredProjects: ProjectCardData[];
}

export function FeaturedSection({ featuredProjects }: FeaturedSectionProps) {
  return (
    <section id="featured-projects" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#D9E2E4] text-[#155761] text-xs font-semibold mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#2F7D78]" />
            <span>Curated &amp; Production Ready</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#102124]">
            Featured Software Solutions
          </h2>
          <p className="text-sm sm:text-base text-[#526267] mt-2 max-w-xl leading-relaxed">
            Hand-selected full-stack architectures, mobile apps, and machine learning models ready for immediate deployment or custom scoping.
          </p>
        </div>

        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#155761] hover:text-[#2F7D78] transition-colors self-start md:self-auto group"
        >
          <span>Browse All Projects</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {featuredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {featuredProjects.map((p) => (
            <div key={p.id} className="h-full">
              <ProjectCard project={p} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-[#D9E2E4]">
          <p className="text-sm text-[#526267]">
            Browse our complete software catalog to discover ready-to-deploy projects.
          </p>
          <div className="mt-4">
            <Link
              href="/projects"
              className="inline-block px-5 py-2.5 rounded-xl bg-[#155761] text-white text-xs font-semibold shadow-xs hover:bg-[#10474F] transition-colors cursor-pointer"
            >
              Explore Projects Catalog
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
