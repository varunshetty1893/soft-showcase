// components/projects/ProjectCard.tsx
// Reusable project listing card.
// Source of truth: docs/08-page-specifications.md & docs/12-component-architecture.md

import Link from "next/link";
import { Sparkles, User as UserIcon } from "lucide-react";
import { PriceBadge } from "./PriceBadge";
import { TechBadge } from "./TechBadge";
import { Badge } from "@/components/ui/badge";

export interface ProjectCardData {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  featured?: boolean;
  priceMode: string;
  price?: { toString(): string } | number | string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  provider?: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
  images?: Array<{
    url: string;
    altText?: string | null;
  }>;
  technologies?: Array<{
    technology: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
}

interface ProjectCardProps {
  project: ProjectCardData;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const primaryImage = project.images?.[0];

  return (
    <article className="group relative flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md hover:border-gray-300 transition-all duration-200">
      {/* ── Image Thumbnail ─────────────────────────────────────────────── */}
      <div className="relative aspect-video w-full bg-gray-100 overflow-hidden border-b border-gray-100">
        {primaryImage?.url ? (
          <img
            src={primaryImage.url}
            alt={primaryImage.altText || project.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50/50 to-gray-100 text-gray-400 p-6 text-center">
            <span className="text-2xl font-black text-indigo-300 mb-1">11</span>
            <span className="text-xs font-medium text-gray-500">{project.title}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {project.category ? (
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-xs shadow-xs text-xs font-medium">
              {project.category.name}
            </Badge>
          ) : <div />}

          {project.featured && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 font-bold text-[11px] shadow-sm">
              <Sparkles className="w-3 h-3 fill-amber-950" />
              <span>Featured</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Card Content ────────────────────────────────────────────────── */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            <Link href={`/projects/${project.slug}`}>
              <span className="absolute inset-0 z-10" />
              {project.title}
            </Link>
          </h3>

          <p className="mt-2 text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {project.shortDescription}
          </p>

          {/* Technology Tags */}
          {project.technologies && project.technologies.length > 0 && (
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {project.technologies.slice(0, 3).map((item) => (
                <TechBadge key={item.technology.id} name={item.technology.name} />
              ))}
            </div>
          )}
        </div>

        {/* ── Footer / Meta ───────────────────────────────────────────────── */}
        <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between">
          <PriceBadge priceMode={project.priceMode} price={project.price} />

          {/* Provider Snippet */}
          {project.provider && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              {project.provider.avatarUrl ? (
                <img
                  src={project.provider.avatarUrl}
                  alt={project.provider.displayName}
                  className="w-4 h-4 rounded-full border border-gray-200"
                />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-gray-400" />
              )}
              <span className="truncate max-w-[100px]">{project.provider.displayName}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
