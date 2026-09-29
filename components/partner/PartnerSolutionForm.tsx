// components/partner/PartnerSolutionForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Code2,
  Star,
  Upload,
  ArrowUp,
  ArrowDown,
  Info,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Category {
  id: string;
  name: string;
}

interface Technology {
  id: string;
  name: string;
}

export interface PhotoItem {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
  storageKey?: string;
}

interface PartnerSolutionFormProps {
  initialData?: any;
  categories: Category[];
  technologies: Technology[];
  isEditing?: boolean;
}

export function PartnerSolutionForm({
  initialData,
  categories,
  technologies,
  isEditing = false,
}: PartnerSolutionFormProps) {
  const router = useRouter();

  const [title, setTitle] = React.useState(initialData?.title || "");
  const [categoryId, setCategoryId] = React.useState(
    initialData?.categoryId || (categories[0]?.id ?? "")
  );
  const [shortDescription, setShortDescription] = React.useState(
    initialData?.shortDescription || ""
  );
  const [fullDescription, setFullDescription] = React.useState(
    initialData?.fullDescription || ""
  );
  const [priceMode, setPriceMode] = React.useState<"FIXED" | "STARTING_FROM" | "CONTACT">(
    initialData?.priceMode || "FIXED"
  );
  const [price, setPrice] = React.useState(initialData?.price ? String(initialData.price) : "24999");
  const [demoUrl, setDemoUrl] = React.useState(initialData?.demoUrl || "");
  const [projectType, setProjectType] = React.useState(initialData?.projectType || "Full-Stack Web App");
  const [status, setStatus] = React.useState<"DRAFT" | "PUBLISHED">(
    initialData?.status || "PUBLISHED"
  );

  // Deliverables (what's included)
  const [whatsIncluded, setWhatsIncluded] = React.useState<string[]>(
    initialData?.whatsIncluded?.length
      ? initialData.whatsIncluded
      : [
          "Complete source code repository with MIT/Commercial license",
          "Database schema and seed migrations",
          "Deployment guides and environment variable templates",
        ]
  );
  const [newDeliverable, setNewDeliverable] = React.useState("");

  // Features list
  const [features, setFeatures] = React.useState<{ feature: string }[]>(
    initialData?.features?.length
      ? initialData.features.map((f: any) => ({ feature: f.feature }))
      : [
          { feature: "Responsive modern user interface built with Tailwind CSS" },
          { feature: "Role-based access control and secure authentication" },
        ]
  );
  const [newFeature, setNewFeature] = React.useState("");

  // Specifications
  const [specifications, setSpecifications] = React.useState<{ key: string; value: string }[]>(
    initialData?.specifications?.length
      ? initialData.specifications.map((s: any) => ({ key: s.key, value: s.value }))
      : [
          { key: "Frontend", value: "Next.js 15, Tailwind CSS, TypeScript" },
          { key: "Database", value: "PostgreSQL / Prisma" },
        ]
  );
  const [specKey, setSpecKey] = React.useState("");
  const [specVal, setSpecVal] = React.useState("");

  // FAQs
  const [faqs, setFaqs] = React.useState<{ question: string; answer: string }[]>(
    initialData?.faqs?.length
      ? initialData.faqs.map((faq: any) => ({ question: faq.question, answer: faq.answer }))
      : [
          {
            question: "Can this solution be customized for our enterprise?",
            answer: "Yes, our team can tailor the features and integration to your exact requirements.",
          },
        ]
  );
  const [faqQ, setFaqQ] = React.useState("");
  const [faqA, setFaqA] = React.useState("");

  // ── Tech stack list + custom tags ──────────────────────────────────────────
  const [allTechs, setAllTechs] = React.useState<Technology[]>(() => {
    const list = [...technologies];
    if (initialData?.technologies) {
      initialData.technologies.forEach((pt: any) => {
        const t = pt.technology || pt;
        if (t && t.id && !list.some((existing) => existing.id === t.id)) {
          list.push({ id: t.id, name: t.name || t.id });
        }
      });
    }
    return list;
  });

  const [selectedTechs, setSelectedTechs] = React.useState<string[]>(() => {
    if (initialData?.technologies?.length) {
      return initialData.technologies.map((t: any) => t.technologyId || t.id);
    }
    return technologies.slice(0, 3).map((t) => t.id);
  });

  const [customTagInput, setCustomTagInput] = React.useState("");

  // ── Photos and Screenshots Gallery ─────────────────────────────────────────
  const [photos, setPhotos] = React.useState<PhotoItem[]>(() => {
    if (initialData?.images?.length) {
      return initialData.images.map((img: any, idx: number) => ({
        id: img.id || `img-${idx}-${Date.now()}`,
        url: img.url,
        altText: img.altText || "",
        isPrimary: img.isPrimary ?? (idx === 0),
        storageKey: img.storageKey,
      }));
    }
    return [
      {
        id: "default-photo-1",
        url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop",
        altText: "Cover Preview",
        isPrimary: true,
      },
    ];
  });

  const [newPhotoUrl, setNewPhotoUrl] = React.useState("");
  const [newPhotoCaption, setNewPhotoCaption] = React.useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ── Tech Tag Handlers ──────────────────────────────────────────────────────
  const handleToggleTech = (id: string) => {
    setSelectedTechs((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const handleAddCustomTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customTagInput.trim();
    if (!trimmed) return;

    // Check if tag already exists in allTechs (case-insensitive)
    const existing = allTechs.find(
      (t) => t.name.toLowerCase() === trimmed.toLowerCase()
    );

    if (existing) {
      if (!selectedTechs.includes(existing.id)) {
        setSelectedTechs((prev) => [...prev, existing.id]);
      }
    } else {
      const newTech: Technology = {
        id: trimmed,
        name: trimmed,
      };
      setAllTechs((prev) => [...prev, newTech]);
      setSelectedTechs((prev) => [...prev, newTech.id]);
    }
    setCustomTagInput("");
  };

  const handleRemoveTech = (id: string) => {
    setSelectedTechs((prev) => prev.filter((t) => t !== id));
  };

  // ── Photo Gallery Handlers ─────────────────────────────────────────────────
  const handleAddPhotoByUrl = () => {
    const trimmed = newPhotoUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("data:image/")) {
      setError("Please provide a valid image URL starting with http:// or https://");
      return;
    }
    const isFirst = photos.length === 0;
    const newPhoto: PhotoItem = {
      id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      url: trimmed,
      altText: newPhotoCaption.trim() || title.trim() || "Project Screenshot",
      isPrimary: isFirst,
    };
    setPhotos((prev) => [...prev, newPhoto]);
    setNewPhotoUrl("");
    setNewPhotoCaption("");
    setError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    setError(null);

    try {
      const addedPhotos: PhotoItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        try {
          const res = await fetch("/api/partner/uploads", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();
          if (res.ok && data.url) {
            addedPhotos.push({
              id: `photo-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
              url: data.url,
              storageKey: data.storageKey,
              altText: file.name.replace(/\.[^/.]+$/, ""),
              isPrimary: photos.length === 0 && addedPhotos.length === 0,
            });
            continue;
          }
        } catch {
          // Fall through to local reader fallback
        }

        // Local Data URL fallback so the image is previewable and persists
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        addedPhotos.push({
          id: `photo-${Date.now()}-${i}`,
          url: dataUrl,
          altText: file.name.replace(/\.[^/.]+$/, ""),
          isPrimary: photos.length === 0 && addedPhotos.length === 0,
        });
      }

      setPhotos((prev) => [...prev, ...addedPhotos]);
    } catch (err: any) {
      setError(err?.message || "Failed to upload image file");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSetPrimaryPhoto = (id: string) => {
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        isPrimary: p.id === id,
      }))
    );
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (filtered.length > 0 && !filtered.some((p) => p.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  const handleUpdatePhotoAlt = (id: string, altText: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, altText } : p))
    );
  };

  const handleMovePhoto = (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= photos.length) return;
    setPhotos((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[newIdx];
      copy[newIdx] = temp;
      return copy;
    });
  };

  // ── Other Handlers ─────────────────────────────────────────────────────────
  const handleAddDeliverable = () => {
    if (!newDeliverable.trim()) return;
    setWhatsIncluded((prev) => [...prev, newDeliverable.trim()]);
    setNewDeliverable("");
  };

  const handleRemoveDeliverable = (idx: number) => {
    setWhatsIncluded((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddFeature = () => {
    if (!newFeature.trim()) return;
    setFeatures((prev) => [...prev, { feature: newFeature.trim() }]);
    setNewFeature("");
  };

  const handleRemoveFeature = (idx: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddSpec = () => {
    if (!specKey.trim() || !specVal.trim()) return;
    setSpecifications((prev) => [...prev, { key: specKey.trim(), value: specVal.trim() }]);
    setSpecKey("");
    setSpecVal("");
  };

  const handleRemoveSpec = (idx: number) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddFaq = () => {
    if (!faqQ.trim() || !faqA.trim()) return;
    setFaqs((prev) => [...prev, { question: faqQ.trim(), answer: faqA.trim() }]);
    setFaqQ("");
    setFaqA("");
  };

  const handleRemoveFaq = (idx: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Submit Handler ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    if (!title.trim() || title.trim().length < 3) {
      setError("Solution title must be at least 3 characters long.");
      return;
    }
    if (!shortDescription.trim() || shortDescription.trim().length < 10) {
      setError("Short teaser description must be at least 10 characters long.");
      return;
    }
    if (!fullDescription.trim() || fullDescription.trim().length < 50) {
      setError(
        `Detailed architecture description must be at least 50 characters long (currently ${fullDescription.trim().length} chars).`
      );
      return;
    }
    if (priceMode === "FIXED" || priceMode === "STARTING_FROM") {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        setError("Please enter a valid positive price for Fixed or Starting From price mode.");
        return;
      }
    }
    if (photos.length === 0) {
      setError("Please add at least one photo or screenshot for your solution.");
      return;
    }

    setLoading(true);

    try {
      const computedPrice =
        priceMode === "CONTACT"
          ? null
          : Number(price) > 0
          ? Number(price)
          : null;

      let formattedDemoUrl: string | null = null;
      if (demoUrl.trim()) {
        const trimmed = demoUrl.trim();
        formattedDemoUrl =
          trimmed.startsWith("http://") || trimmed.startsWith("https://")
            ? trimmed
            : `https://${trimmed}`;
      }

      const payload = {
        title: title.trim(),
        slug: initialData?.slug || undefined,
        categoryId,
        shortDescription: shortDescription.trim(),
        fullDescription: fullDescription.trim(),
        priceMode,
        price: computedPrice,
        demoUrl: formattedDemoUrl,
        projectType: projectType.trim() || "Web Application",
        status,
        whatsIncluded,
        features: features.map((f, i) => ({ feature: f.feature, sortOrder: i + 1 })),
        specifications: specifications.map((s, i) => ({
          key: s.key,
          value: s.value,
          sortOrder: i + 1,
        })),
        faqs: faqs.map((faq, i) => ({
          question: faq.question,
          answer: faq.answer,
          sortOrder: i + 1,
        })),
        technologyIds: selectedTechs,
        technologies: selectedTechs.map((id) => {
          const tech = allTechs.find((t) => t.id === id);
          return tech ? tech.name : id;
        }),
        images: photos.map((p, i) => ({
          url: p.url.trim(),
          storageKey: p.storageKey || `partner-sol-${Date.now()}-${i}`,
          altText: p.altText.trim() || title.trim(),
          isPrimary: p.isPrimary,
          sortOrder: i + 1,
        })),
      };

      const url = isEditing
        ? `/api/partner/solutions/${initialData.id}`
        : `/api/partner/solutions`;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        let msg = resData.error || "Failed to save solution";
        if (resData.details?.fieldErrors) {
          const detailList = Object.entries(resData.details.fieldErrors)
            .map(([field, errs]) => `${field}: ${(errs as string[]).join(", ")}`)
            .join(" • ");
          if (detailList) {
            msg = `${msg} (${detailList})`;
          }
        }
        throw new Error(msg);
      }

      router.push("/partner/solutions");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Unable to submit solution</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* ── 1. Core Solution Overview ─────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#155761]" />
          1. Basic Solution Details
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold text-[#102124]">Solution Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI Resume & ATS Optimizer Platform"
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-[#102124]">Architecture Category *</Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-[#102124]">Project Deliverable Type</Label>
            <Input
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              placeholder="e.g. Full-Stack Web App, Microservice, Boilerplate"
              className="mt-1"
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold text-[#102124]">
              Short Teaser Description (Max 160 characters) *
            </Label>
            <Input
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="A high-level 1-sentence summary displayed in search and catalog cards."
              maxLength={180}
              required
              className="mt-1"
            />
          </div>

          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold text-[#102124]">
              Comprehensive Architecture &amp; System Overview *
            </Label>
            <Textarea
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Explain how the application works, setup requirements, data models, third-party services, and deployment architecture..."
              rows={6}
              required
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* ── 2. Pricing & Visibility ───────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          2. Commercial Pricing &amp; Visibility Status
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs font-semibold text-[#102124]">Pricing Mode</Label>
            <select
              value={priceMode}
              onChange={(e) => setPriceMode(e.target.value as any)}
              className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
            >
              <option value="FIXED">Fixed Price (INR)</option>
              <option value="STARTING_FROM">Starting From (INR)</option>
              <option value="CONTACT">Contact for Quote</option>
            </select>
          </div>

          {priceMode !== "CONTACT" && (
            <div>
              <Label className="text-xs font-semibold text-[#102124]">Price (INR) *</Label>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="24999"
                required
                className="mt-1"
              />
            </div>
          )}

          <div>
            <Label className="text-xs font-semibold text-[#102124]">Publishing Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
            >
              <option value="PUBLISHED">Published (Visible on Showcase)</option>
              <option value="DRAFT">Draft (Internal Architecture Only)</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <Label className="text-xs font-semibold text-[#102124]">Live Demo URL (Optional)</Label>
            <Input
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://demo.yourdomain.com"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Project Photos & Screenshots Gallery ─────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-[#F3F7F7] pb-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#102124] flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#155761]" />
              3. Project Photos &amp; Screenshots Gallery
            </h2>
            <span className="text-xs font-medium text-[#526267]">
              {photos.length} {photos.length === 1 ? "photo" : "photos"} added
            </span>
          </div>

          {/* Explanation Banner */}
          <div className="mt-3 p-3.5 rounded-2xl bg-[#E8F3F4]/80 border border-[#BEDEE1] text-xs text-[#155761] flex items-start gap-2.5">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#155761]" />
            <div>
              <p className="font-semibold">Why is there a Primary Image?</p>
              <p className="mt-0.5 text-[#2D5B60] leading-relaxed">
                The <strong>Primary Cover Image</strong> is the main card thumbnail displayed across the catalog listing (<code>/projects</code>), home page cards, and search results.
                All other images become <strong>Gallery Screenshots</strong> on your solution&apos;s detail page, allowing buyers to see your dashboards, mobile views, and feature walkthroughs.
                Use the <strong>★ Set as Primary</strong> button on any photo to choose your cover image!
              </p>
            </div>
          </div>
        </div>

        {/* Adding New Photos: File Upload or Image URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F8FAFA] border border-[#D9E2E4]">
          {/* Method A: Upload Image Files */}
          <div className="space-y-3">
            <Label className="text-xs font-semibold text-[#102124] flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[#155761]" />
              Upload Photos from Device
            </Label>
            <p className="text-[11px] text-[#526267]">
              Select one or multiple screenshots (PNG, JPG, WebP up to 5MB each).
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              disabled={isUploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border border-[#D9E2E4] bg-white hover:bg-[#F3F7F7] text-xs font-semibold text-[#102124] h-10 gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#155761]" />
              {isUploadingPhoto ? "Uploading Photos..." : "Choose Photo Files to Upload"}
            </Button>
          </div>

          {/* Method B: Paste Image URL */}
          <div className="space-y-3 border-t md:border-t-0 md:border-l border-[#D9E2E4] pt-4 md:pt-0 md:pl-4">
            <Label className="text-xs font-semibold text-[#102124] flex items-center gap-1.5">
              <ExternalLink className="w-3.5 h-3.5 text-[#155761]" />
              Add via Image URL
            </Label>
            <div className="space-y-2">
              <Input
                type="url"
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or GitHub raw URL"
                className="text-xs"
              />
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  placeholder="Caption (e.g. Analytics Dashboard)"
                  className="text-xs flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddPhotoByUrl}
                  disabled={!newPhotoUrl.trim()}
                  className="rounded-xl bg-[#155761] hover:bg-[#0E3E45] text-white text-xs px-3.5 h-9 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Photo
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Photos Grid */}
        {photos.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl border-2 border-dashed border-[#D9E2E4] bg-[#F8FAFA]">
            <ImageIcon className="w-8 h-8 text-[#526267] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-[#102124]">No photos added yet</p>
            <p className="text-xs text-[#526267] mt-1 max-w-sm mx-auto">
              Add at least one screenshot or mockup photo so customers can preview your solution in the catalog.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo, idx) => (
              <div
                key={photo.id}
                className={`relative rounded-2xl border transition-all overflow-hidden flex flex-col justify-between bg-white ${
                  photo.isPrimary
                    ? "border-[#155761] ring-2 ring-[#155761]/30 shadow-md"
                    : "border-[#D9E2E4] shadow-2xs hover:border-[#BEDEE1]"
                }`}
              >
                {/* Thumbnail Preview */}
                <div className="relative aspect-video w-full bg-slate-100 overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.altText || "Project photo"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Primary Cover Badge */}
                  {photo.isPrimary ? (
                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-[#155761] text-white text-[11px] font-bold shadow-md flex items-center gap-1.5 backdrop-blur-xs">
                      <Star className="w-3.5 h-3.5 fill-current text-amber-300" />
                      Primary Cover
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryPhoto(photo.id)}
                      className="absolute top-2 left-2 px-2 py-1 rounded-full bg-black/60 hover:bg-[#155761] text-white text-[11px] font-medium shadow-xs transition-colors flex items-center gap-1 backdrop-blur-xs cursor-pointer opacity-90 hover:opacity-100"
                    >
                      <Star className="w-3 h-3" />
                      Make Primary
                    </button>
                  )}

                  {/* Reorder Buttons */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(idx, "up")}
                        title="Move photo earlier in gallery"
                        className="w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {idx < photos.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMovePhoto(idx, "down")}
                        title="Move photo later in gallery"
                        className="w-7 h-7 rounded-lg bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Photo Details & Actions */}
                <div className="p-3.5 space-y-2.5">
                  <div>
                    <Label className="text-[11px] font-semibold text-[#526267]">
                      Caption / Alt Text
                    </Label>
                    <Input
                      type="text"
                      value={photo.altText}
                      onChange={(e) => handleUpdatePhotoAlt(photo.id, e.target.value)}
                      placeholder="e.g. Dashboard Analytics"
                      className="mt-1 h-8 text-xs rounded-lg"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#F3F7F7]">
                    <span className="text-[11px] text-[#526267]">
                      {photo.isPrimary ? "Card Thumbnail" : `Gallery Photo #${idx + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. Tech Stack Tags ────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-5">
        <div className="border-b border-[#F3F7F7] pb-3">
          <h2 className="text-base font-bold text-[#102124] flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#155761]" />
            4. Tech Stack Tags
          </h2>
          <p className="text-xs text-[#526267] mt-0.5">
            Select popular technologies or type custom tags to describe your stack.
          </p>
        </div>

        {/* Custom Tag Input */}
        <div className="p-4 rounded-2xl bg-[#F8FAFA] border border-[#D9E2E4] space-y-2">
          <Label className="text-xs font-semibold text-[#102124]">
            Add Custom Tech Tag
          </Label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomTag();
                }
              }}
              placeholder="Type any technology (e.g. PyTorch, Kubernetes, LangChain, Solidity, Tailwind v4...)"
              className="text-xs flex-1 bg-white"
            />
            <Button
              type="button"
              onClick={handleAddCustomTag}
              disabled={!customTagInput.trim()}
              className="rounded-xl bg-[#155761] hover:bg-[#0E3E45] text-white text-xs px-4 h-10 gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Tag
            </Button>
          </div>
        </div>

        {/* Selected Tags Display */}
        {selectedTechs.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-[#102124] flex items-center justify-between">
              <span>Selected Tech Tags ({selectedTechs.length})</span>
              <button
                type="button"
                onClick={() => setSelectedTechs([])}
                className="text-[11px] text-[#526267] hover:text-rose-600 transition-colors cursor-pointer"
              >
                Clear all
              </button>
            </Label>
            <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-white border border-[#D9E2E4]">
              {selectedTechs.map((id) => {
                const tech = allTechs.find((t) => t.id === id);
                const tagName = tech ? tech.name : id;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#155761] text-white shadow-2xs"
                  >
                    <span>{tagName}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTech(id)}
                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors cursor-pointer"
                      title="Remove tag"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Select Popular Technologies */}
        <div className="space-y-2 pt-1">
          <Label className="text-xs font-semibold text-[#526267]">
            Popular / Suggested Technologies
          </Label>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
            {allTechs.map((t) => {
              const isSelected = selectedTechs.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleToggleTech(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#155761] text-white shadow-xs"
                      : "bg-[#F3F7F7] text-[#526267] hover:bg-[#E5EEEE] border border-[#D9E2E4]"
                  }`}
                >
                  {t.name}
                  {isSelected && <span className="ml-1 opacity-70">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 5. Deliverables ("What's Included") ───────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          5. Deliverables (&quot;What&apos;s Included&quot;)
        </h2>

        <div className="space-y-2">
          {whatsIncluded.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] text-xs font-medium text-[#102124]"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#155761] shrink-0" />
                <span>{item}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveDeliverable(idx)}
                className="text-rose-500 hover:text-rose-700 p-1 rounded-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Input
            value={newDeliverable}
            onChange={(e) => setNewDeliverable(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddDeliverable();
              }
            }}
            placeholder="e.g. Docker container compose configuration"
            className="text-xs"
          />
          <Button
            type="button"
            onClick={handleAddDeliverable}
            className="rounded-xl bg-[#155761] hover:bg-[#0E3E45] text-white text-xs px-4 h-10 gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Deliverable
          </Button>
        </div>
      </div>

      {/* ── 6. Key Features ───────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          6. Key Architectural Features
        </h2>

        <div className="space-y-2">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] text-xs font-medium text-[#102124]"
            >
              <span>{f.feature}</span>
              <button
                type="button"
                onClick={() => handleRemoveFeature(idx)}
                className="text-rose-500 hover:text-rose-700 p-1 rounded-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Input
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddFeature();
              }
            }}
            placeholder="e.g. Automated PDF invoice generation using Headless Chromium"
            className="text-xs"
          />
          <Button
            type="button"
            onClick={handleAddFeature}
            className="rounded-xl bg-[#155761] hover:bg-[#0E3E45] text-white text-xs px-4 h-10 gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Feature
          </Button>
        </div>
      </div>

      {/* ── 7. Technical Specifications ───────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          7. Technical Specifications (Key-Value)
        </h2>

        <div className="space-y-2">
          {specifications.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] text-xs font-medium text-[#102124]"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#155761]">{s.key}:</span>
                <span>{s.value}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveSpec(idx)}
                className="text-rose-500 hover:text-rose-700 p-1 rounded-md transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
          <Input
            value={specKey}
            onChange={(e) => setSpecKey(e.target.value)}
            placeholder="Key (e.g. Memory)"
            className="text-xs"
          />
          <Input
            value={specVal}
            onChange={(e) => setSpecVal(e.target.value)}
            placeholder="Value (e.g. 512MB RAM minimum)"
            className="text-xs"
          />
          <Button
            type="button"
            onClick={handleAddSpec}
            className="rounded-xl bg-[#155761] hover:bg-[#0E3E45] text-white text-xs px-4 h-10 gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Spec
          </Button>
        </div>
      </div>

      {/* ── 8. FAQs ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#155761]" />
          8. Frequently Asked Questions
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] text-xs space-y-1 relative pr-10"
            >
              <p className="font-bold text-[#102124]">Q: {faq.question}</p>
              <p className="text-[#526267] leading-relaxed">A: {faq.answer}</p>
              <button
                type="button"
                onClick={() => handleRemoveFaq(idx)}
                className="absolute top-3 right-3 text-rose-500 hover:text-rose-700 p-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2">
          <Input
            value={faqQ}
            onChange={(e) => setFaqQ(e.target.value)}
            placeholder="Question: e.g. Does it include automated deployment scripts?"
            className="text-xs"
          />
          <Textarea
            value={faqA}
            onChange={(e) => setFaqA(e.target.value)}
            placeholder="Answer: e.g. Yes, GitHub Actions CI/CD workflows are provided for AWS and Vercel."
            rows={2}
            className="text-xs"
          />
          <Button
            type="button"
            onClick={handleAddFaq}
            className="rounded-xl bg-[#155761] hover:bg-[#0E3E45] text-white text-xs px-4 h-10 gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add FAQ
          </Button>
        </div>
      </div>

      {/* ── Submit / Cancel Footer ────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-4 border-t border-[#D9E2E4]">
        <Link
          href="/partner/solutions"
          className="text-xs font-semibold text-[#526267] hover:text-[#102124] transition-colors"
        >
          Cancel and return to Solutions
        </Link>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-[#155761] hover:bg-[#0E3E45] text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            {loading ? "Saving Solution..." : isEditing ? "Save & Update Solution" : "Publish Solution"}
          </Button>
        </div>
      </div>
    </form>
  );
}
