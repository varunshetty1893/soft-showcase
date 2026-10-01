// components/projects/ProjectCard.tsx
// Reusable project listing card.
// Source of truth: docs/08-page-specifications.md & docs/12-component-architecture.md

import Link from "next/link";
import Image from "next/image";
import { Sparkles, User as UserIcon } from "lucide-react";
import { PriceBadge } from "./PriceBadge";
import { TechBadge } from "./TechBadge";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

export interface ProjectCardData {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  featured?: boolean;
  priceMode: string;
  price?: { toString(): string } | number | string | null;
  originalPrice?: { toString(): string } | number | string | null;
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
    <article className="group relative flex flex-col h-full bg-white rounded-xl border border-[#D9E2E4] overflow-hidden shadow-xs hover:shadow-md hover:border-[#155761]/40 transition-all duration-200">
      {/* ── Image Thumbnail ─────────────────────────────────────────────── */}
      <div className="relative aspect-video w-full bg-[#F3F7F7] overflow-hidden border-b border-[#D9E2E4] shrink-0">
        {primaryImage?.url ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.altText || `${project.title} software preview thumbnail`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized={primaryImage.url.startsWith("data:")}
            referrerPolicy="no-referrer"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8FAFA] text-[#526267] p-6 text-center">
            <span className="text-xl font-bold text-[#155761] mb-1">Soft Showcase</span>
            <span className="text-xs font-medium text-[#526267]">{project.title}</span>
          </div>
        )}

        {/* Top Badges & Actions */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
          <div className="flex items-center gap-1.5">
            {project.category && (
              <Badge variant="secondary" className="bg-white/95 backdrop-blur-xs shadow-xs text-xs font-medium border-[#D9E2E4] text-[#155761]">
                {project.category.name}
              </Badge>
            )}

            {project.featured && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#DDF4EC] text-[#155761] border border-[#2F7D78]/25 font-bold text-[11px] shadow-xs">
                <Sparkles className="w-3 h-3 text-[#2F7D78]" />
                <span>Featured</span>
              </div>
            )}
          </div>

          <AddToCartButton
            project={{
              id: project.id,
              title: project.title,
              slug: project.slug,
              shortDescription: project.shortDescription,
              priceMode: project.priceMode,
              price: project.price ? project.price.toString() : null,
              imageUrl: primaryImage?.url || null,
              providerName: project.provider?.displayName || null,
              categoryName: project.category?.name || null,
            }}
            variant="compact"
            className="shadow-sm bg-white/90 backdrop-blur-xs hover:bg-white"
          />
        </div>
      </div>

      {/* ── Card Content ────────────────────────────────────────────────── */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div className="flex-1 flex flex-col">
          <h3 className="text-base font-bold text-[#102124] group-hover:text-[#155761] transition-colors line-clamp-1">
            <Link href={`/projects/${project.slug}`} prefetch={true}>
              <span className="absolute inset-0 z-10" />
              {project.title}
            </Link>
          </h3>

          <p className="mt-2 text-xs text-[#526267] line-clamp-2 leading-relaxed min-h-[2.5rem]">
            {project.shortDescription}
          </p>

          {/* Technology Tags */}
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5 min-h-[1.75rem]">
            {project.technologies && project.technologies.length > 0 ? (
              project.technologies.slice(0, 3).map((item) => (
                <TechBadge key={item.technology.id} name={item.technology.name} />
              ))
            ) : (
              <span className="text-[11px] text-[#526267]/50 italic">Full-stack software</span>
            )}
          </div>
        </div>

        {/* ── Footer / Meta ───────────────────────────────────────────────── */}
        <div className="mt-5 pt-3.5 border-t border-[#F3F7F7] flex items-center justify-between gap-2.5">
          <PriceBadge
            priceMode={project.priceMode}
            price={project.price}
            originalPrice={project.originalPrice}
            variant="card"
          />

          {/* Provider Snippet */}
          {project.provider && (
            <div className="flex items-center gap-1.5 text-xs text-[#526267] font-medium shrink-0">
              {project.provider.avatarUrl ? (
                <Image
                  src={project.provider.avatarUrl}
                  alt={project.provider.displayName}
                  width={16}
                  height={16}
                  unoptimized={project.provider.avatarUrl.startsWith("data:")}
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-full border border-[#D9E2E4] object-cover"
                />
              ) : (
                <UserIcon className="w-3.5 h-3.5 text-[#526267]" />
              )}
              <span className="truncate max-w-[120px]">{project.provider.displayName}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
