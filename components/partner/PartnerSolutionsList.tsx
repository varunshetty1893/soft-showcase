"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Layers,
  Edit2,
  ExternalLink,
  MessageSquare,
  Star,
  Loader2,
  FileCode,
  Plus,
  AlertCircle,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";

export interface PartnerSolutionItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  priceMode: string;
  price: string | number | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  category?: { id: string; name: string; slug: string } | null;
  images?: Array<{ url: string; altText?: string | null }>;
  _count?: {
    inquiries: number;
    transactions?: number;
  };
}

interface PartnerSolutionsListProps {
  initialProjects: PartnerSolutionItem[];
}

export function PartnerSolutionsList({ initialProjects }: PartnerSolutionsListProps) {
  const router = useRouter();
  const [projects, setProjects] = React.useState<PartnerSolutionItem[]>(initialProjects);
  const [togglingId, setTogglingId] = React.useState<string | null>(null);
  const [errorNotice, setErrorNotice] = React.useState<string | null>(null);

  React.useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  const handleToggleFeatured = async (project: PartnerSolutionItem) => {
    const nextFeatured = !project.featured;
    setTogglingId(project.id);
    setErrorNotice(null);

    // Optimistic update
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? { ...p, featured: nextFeatured } : p))
    );

    try {
      const res = await fetch(`/api/partner/solutions/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: nextFeatured }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to update featured status");
      }

      router.refresh();
    } catch (err: any) {
      // Revert optimistic update
      setProjects((prev) =>
        prev.map((p) => (p.id === project.id ? { ...p, featured: project.featured } : p))
      );
      setErrorNotice(err?.message || "Failed to change featured status. Please try again.");
    } finally {
      setTogglingId(null);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-12 text-center shadow-xs space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#F3F7F7] text-[#155761] flex items-center justify-center mx-auto">
          <Layers className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-[#102124]">No Solutions Listed Yet</h3>
          <p className="text-xs text-[#526267] max-w-md mx-auto leading-relaxed">
            You haven&apos;t added any software projects yet. You can create a solution manually or import from an AI-generated JSON file in one click.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/partner/solutions/new"
            className={buttonVariants({
              variant: "primary",
              size: "sm",
              className: "gap-2 font-bold shadow-xs",
            })}
          >
            <Plus className="w-4 h-4" />
            Add Solution
          </Link>
          <Link
            href="/partner/solutions/import"
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: "gap-2 font-semibold",
            })}
          >
            <FileCode className="w-4 h-4 text-[#155761]" />
            Import via JSON
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {errorNotice && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((proj) => {
          const primaryImg = proj.images?.[0]?.url || null;
          const isToggling = togglingId === proj.id;

          return (
            <div
              key={proj.id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col justify-between group shadow-2xs hover:shadow-md ${
                proj.featured
                  ? "border-amber-300 ring-1 ring-amber-300/40"
                  : "border-[#D9E2E4]"
              }`}
            >
              <div>
                {/* Thumbnail Banner */}
                <div className="relative h-44 w-full bg-[#102124]/5 overflow-hidden">
                  {primaryImg ? (
                    <Image
                      src={primaryImg}
                      alt={proj.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-102 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      unoptimized={primaryImg.startsWith("data:")}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#F8FAFA] text-[#526267] p-4 text-center">
                      <Layers className="w-8 h-8 text-[#155761]/60 mb-2" />
                      <span className="text-xs font-semibold text-[#102124] line-clamp-1">
                        {proj.title}
                      </span>
                      <span className="text-[10px] text-[#526267] mt-0.5">No cover image</span>
                    </div>
                  )}

                  {/* Top-Left Status and Category Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap z-10">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold shadow-xs ${
                        proj.status === "PUBLISHED"
                          ? "bg-[#DDF4EC] text-[#2F7D78] border border-[#2F7D78]/30"
                          : "bg-[#F3F7F7] text-[#526267] border border-[#D9E2E4]"
                      }`}
                    >
                      {proj.status === "PUBLISHED" ? "Live" : "Draft"}
                    </span>
                    {proj.category && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/95 backdrop-blur-xs text-[#102124] border border-[#D9E2E4] shadow-xs">
                        {proj.category.name}
                      </span>
                    )}
                  </div>

                  {/* Top-Right Quick Featured Toggle Button */}
                  <div className="absolute top-2.5 right-2.5 z-10">
                    <button
                      type="button"
                      onClick={() => handleToggleFeatured(proj)}
                      disabled={isToggling}
                      title={
                        proj.featured
                          ? "Featured solution (highlighted in catalog). Click to unfeature."
                          : "Click to mark as Featured on catalog & homepage"
                      }
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold shadow-sm transition-all cursor-pointer select-none active:scale-95 ${
                        proj.featured
                          ? "bg-amber-400 hover:bg-amber-500 text-amber-950 border border-amber-500"
                          : "bg-black/60 hover:bg-[#155761] text-white backdrop-blur-xs border border-white/20"
                      }`}
                    >
                      {isToggling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : proj.featured ? (
                        <>
                          <Star className="w-3.5 h-3.5 fill-current text-amber-950" />
                          <span>Featured</span>
                        </>
                      ) : (
                        <>
                          <Star className="w-3.5 h-3.5 text-white/80" />
                          <span>+ Feature</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className="font-bold text-sm text-[#102124] line-clamp-1"
                      title={proj.title}
                    >
                      {proj.title}
                    </h3>
                    <span className="text-xs font-extrabold text-[#155761] shrink-0">
                      {proj.priceMode === "CONTACT"
                        ? "Contact"
                        : formatCurrency(Number(proj.price))}
                    </span>
                  </div>

                  <p className="text-xs text-[#526267] line-clamp-2 leading-relaxed">
                    {proj.shortDescription}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-[#526267] pt-2 border-t border-[#F3F7F7]">
                    <span className="flex items-center gap-1 font-medium">
                      <MessageSquare className="w-3.5 h-3.5 text-[#155761]" />
                      {proj._count?.inquiries ?? 0} Enquiries
                    </span>
                    <span className="font-mono text-[10px] text-[#8A9B9F] truncate max-w-[120px]">
                      /{proj.slug}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="px-4 py-2.5 bg-[#F8FAFA] border-t border-[#D9E2E4] flex items-center justify-between gap-2">
                <div>
                  {proj.status === "PUBLISHED" && (
                    <Link
                      href={`/projects/${proj.slug}`}
                      target="_blank"
                      className="text-xs font-semibold text-[#526267] hover:text-[#155761] flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>View</span>
                    </Link>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/partner/solutions/${proj.id}/edit`}
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className: "h-7 px-2.5 text-xs gap-1 font-semibold",
                    })}
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
