"use client";
// components/admin/ProjectForm.tsx
// Reusable form for creating and editing projects in Admin.
// - Phase 1: Shared auto-dismissing toast system (useToast).
// - Phase 3: For partner-owned projects, renders a Moderation Panel + read-only content preview
//   ("Managed by <partner>. Admin can only change moderation settings."). No price, deal, or
//   tech-stack inputs are rendered. Supports "Request changes" which stores moderationNote and
//   emails the partner.
// - Phase 4: Uses shared PricingOffersFields for admin-managed projects.

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Trash2,
  Star,
  ShieldAlert,
  Send,
  Loader2,
  ExternalLink,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { ImageUploader, type ProjectImageItem } from "@/components/admin/ImageUploader";
import {
  PricingOffersFields,
  type PricingOffersFormState,
} from "@/components/projects/PricingOffersFields";
import { PriceBlock } from "@/components/projects/PriceBlock";
import {
  fromIstDatetimeLocal,
  toIstDatetimeLocal,
  type DealTypeValue,
  type PriceQualifierValue,
} from "@/lib/utils/pricing";
import { useToast } from "@/components/ui/toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = { id: string; name: string; slug: string };
type Technology = { id: string; name: string; slug: string };
type Provider = {
  id: string;
  displayName: string;
  email: string;
  whatsappNumber: string | null;
};

type FeatureItem = { id: string; feature: string };
type SpecItem = { id: string; key: string; value: string };
type FaqItem = { id: string; question: string; answer: string };

export type ProjectFormData = {
  // Core
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  featuredOrder: number;
  moderationNote?: string;
  moderatedAt?: string | null;
  // Pricing & Offers (Phase 4)
  priceMode: "CONTACT" | "FIXED" | "STARTING_FROM" | "FREE";
  price: string;
  originalPrice: string;
  priceQualifier: PriceQualifierValue;
  dealType: DealTypeValue;
  dealLabel: string;
  dealStartsAt: string;
  dealEndsAt: string;
  // Details
  demoUrl: string;
  projectType: string;
  categoryId: string;
  categoryName?: string;
  providerId: string;
  // Lists
  whatsIncluded: string[];
  features: FeatureItem[];
  specifications: SpecItem[];
  faqs: FaqItem[];
  technologyIds: string[];
  technologyNames?: string[];
};

type ProjectFormProps = {
  /** Pass existing project data to populate an edit form */
  initialData?: Partial<ProjectFormData>;
  /** ID of the project being edited (undefined for new) */
  projectId?: string;
  /** Existing images for the project (edit mode only) */
  initialImages?: ProjectImageItem[];
  /** Whether the project belongs to an external Solution Partner */
  isPartnerOwned?: boolean;
  /** Display name of the owning Solution Partner */
  partnerDisplayName?: string;
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2);
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 150);
}

const EMPTY: ProjectFormData = {
  title: "",
  slug: "",
  shortDescription: "",
  fullDescription: "",
  status: "DRAFT",
  featured: false,
  featuredOrder: 0,
  moderationNote: "",
  moderatedAt: null,
  priceMode: "CONTACT",
  price: "",
  originalPrice: "",
  priceQualifier: "NONE",
  dealType: "NONE",
  dealLabel: "",
  dealStartsAt: "",
  dealEndsAt: "",
  demoUrl: "",
  projectType: "",
  categoryId: "",
  providerId: "",
  whatsIncluded: [],
  features: [],
  specifications: [],
  faqs: [],
  technologyIds: [],
  technologyNames: [],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ListEditor<T extends { id: string }>({
  label,
  items,
  renderItem,
  onAdd,
  onRemove,
}: {
  label: string;
  items: T[];
  renderItem: (item: T, onChange: (updated: T) => void) => React.ReactNode;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider">
          {label}
        </label>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs px-3 py-1 bg-[#155761] hover:bg-[#10474F] text-white rounded-lg transition font-medium cursor-pointer shadow-xs"
        >
          + Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex gap-2 items-start">
            <span className="mt-2 text-xs text-gray-500 w-5 shrink-0">{index + 1}.</span>
            <div className="flex-1">
              {renderItem(item, (updated) => {
                void updated;
              })}
            </div>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="mt-2 text-red-400 hover:text-red-300 text-sm shrink-0"
              title="Remove"
            >
              ✕
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-gray-500 italic">No items yet. Click + Add to start.</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjectForm({
  initialData,
  projectId,
  initialImages,
  isPartnerOwned = false,
  partnerDisplayName,
}: ProjectFormProps) {
  const router = useRouter();
  const toast = useToast();
  const isEditing = !!projectId;

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState<ProjectFormData>(() => ({
    ...EMPTY,
    ...initialData,
    dealStartsAt: initialData?.dealStartsAt
      ? toIstDatetimeLocal(initialData.dealStartsAt)
      : "",
    dealEndsAt: initialData?.dealEndsAt
      ? toIstDatetimeLocal(initialData.dealEndsAt)
      : "",
  }));
  const [images, setImages] = useState<ProjectImageItem[]>(initialImages ?? []);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing);
  const [whatsIncludedInput, setWhatsIncludedInput] = useState(
    initialData?.whatsIncluded?.join("\n") ?? ""
  );

  // Moderation panel state for Partner-Owned projects (Phase 3)
  const [moderationStatus, setModerationStatus] = useState<
    "PUBLISHED" | "UNPUBLISHED" | "REJECTED" | "ARCHIVED"
  >(() => {
    if (initialData?.status === "PUBLISHED") return "PUBLISHED";
    if (initialData?.status === "ARCHIVED") return "ARCHIVED";
    return "UNPUBLISHED";
  });
  const [moderationReason, setModerationReason] = useState(
    initialData?.moderationNote ?? ""
  );
  const [changeRequestNote, setChangeRequestNote] = useState(
    initialData?.moderationNote ?? ""
  );
  const [sendingRequestChanges, setSendingRequestChanges] = useState(false);

  // ── Selector data ────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectorsLoading, setSelectorsLoading] = useState(true);

  // ── Submission state ─────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteProject() {
    if (!projectId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || "Failed to delete project");
      }
      toast.success("Project deleted successfully.");
      router.push("/admin/projects");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete project. Please try again.");
      setShowDeleteModal(false);
      setDeleting(false);
    }
  }

  // ── Load selectors ───────────────────────────────────────────────────────────
  useEffect(() => {
    async function loadSelectors() {
      try {
        const res = await fetch("/api/admin/projects/selectors");
        if (!res.ok) throw new Error("Failed to load selectors");
        const data = await res.json();
        setCategories(data.categories || []);
        setTechnologies(data.technologies || []);
        setProviders(data.providers || []);
      } catch {
        toast.error("Failed to load form selectors. Please refresh the page.");
      } finally {
        setSelectorsLoading(false);
      }
    }
    loadSelectors();
  }, [toast]);

  // ── Auto-slug from title ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!slugManuallyEdited && form.title) {
      setForm((prev) => ({ ...prev, slug: slugify(form.title) }));
    }
  }, [form.title, slugManuallyEdited]);

  // ── Field helpers ────────────────────────────────────────────────────────────
  const set = useCallback(
    <K extends keyof ProjectFormData>(key: K, value: ProjectFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setErrors((prev) => ({ ...prev, [key]: [] }));
    },
    []
  );

  // ── Feature list ─────────────────────────────────────────────────────────────
  const addFeature = () =>
    setForm((p) => ({ ...p, features: [...p.features, { id: generateId(), feature: "" }] }));
  const removeFeature = (id: string) =>
    setForm((p) => ({ ...p, features: p.features.filter((f) => f.id !== id) }));
  const updateFeature = (id: string, value: string) =>
    setForm((p) => ({
      ...p,
      features: p.features.map((f) => (f.id === id ? { ...f, feature: value } : f)),
    }));

  // ── Spec list ────────────────────────────────────────────────────────────────
  const addSpec = () =>
    setForm((p) => ({
      ...p,
      specifications: [...p.specifications, { id: generateId(), key: "", value: "" }],
    }));
  const removeSpec = (id: string) =>
    setForm((p) => ({ ...p, specifications: p.specifications.filter((s) => s.id !== id) }));
  const updateSpec = (id: string, field: "key" | "value", value: string) =>
    setForm((p) => ({
      ...p,
      specifications: p.specifications.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    }));

  // ── FAQ list ──────────────────────────────────────────────────────────────────
  const addFaq = () =>
    setForm((p) => ({
      ...p,
      faqs: [...p.faqs, { id: generateId(), question: "", answer: "" }],
    }));
  const removeFaq = (id: string) =>
    setForm((p) => ({ ...p, faqs: p.faqs.filter((f) => f.id !== id) }));
  const updateFaq = (id: string, field: "question" | "answer", value: string) =>
    setForm((p) => ({
      ...p,
      faqs: p.faqs.map((f) => (f.id === id ? { ...f, [field]: value } : f)),
    }));

  // ── Technology toggle ─────────────────────────────────────────────────────────
  const toggleTechnology = (techId: string) => {
    setForm((p) => ({
      ...p,
      technologyIds: p.technologyIds.includes(techId)
        ? p.technologyIds.filter((id) => id !== techId)
        : [...p.technologyIds, techId],
    }));
  };

  // ── Phase 3: Save Moderation Settings for Partner-Owned Project ──────────────
  async function handleSaveModeration(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId) return;

    const requiresReason =
      moderationStatus === "UNPUBLISHED" || moderationStatus === "REJECTED";
    if (requiresReason && !moderationReason.trim()) {
      toast.error(
        "A moderation reason is required when unpublishing or rejecting a partner-owned project."
      );
      return;
    }

    setSaving(true);
    try {
      const payload = {
        featured: form.featured,
        featuredOrder: Number(form.featuredOrder) || 0,
        status: moderationStatus,
        categoryId: form.categoryId,
        moderationNote: moderationReason.trim() || null,
      };

      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to update moderation settings.");
        return;
      }

      toast.success(data.message || "Moderation settings updated successfully.");
      router.push("/admin/projects");
      router.refresh();
    } catch {
      toast.error("Network error while saving moderation settings.");
    } finally {
      setSaving(false);
    }
  }

  // ── Phase 3: Request Changes on Partner-Owned Project ────────────────────────
  async function handleRequestChanges() {
    if (!projectId) return;
    if (!changeRequestNote.trim()) {
      toast.error("Please enter a note describing the requested changes for the partner.");
      return;
    }

    setSendingRequestChanges(true);
    try {
      const res = await fetch(`/api/admin/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestChanges: true,
          moderationNote: changeRequestNote.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to send change request.");
        return;
      }

      setModerationReason(changeRequestNote.trim());
      toast.success(
        data.message || "Change request saved and emailed to the partner."
      );
      router.refresh();
    } catch {
      toast.error("Network error while sending change request.");
    } finally {
      setSendingRequestChanges(false);
    }
  }

  // ── Submit (Admin-Managed Project) ───────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isEditing && isPartnerOwned) {
      return handleSaveModeration(e);
    }

    setSaving(true);
    setErrors({});

    const whatsIncluded = whatsIncludedInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedPrice =
      form.priceMode === "FIXED" || form.priceMode === "STARTING_FROM"
        ? parseFloat(form.price) || null
        : null;

    const rawOriginalPrice =
      form.priceMode === "FIXED" && form.originalPrice && form.originalPrice.trim() !== ""
        ? parseFloat(form.originalPrice) || null
        : null;

    if (
      form.priceMode === "FIXED" &&
      rawOriginalPrice !== null &&
      parsedPrice !== null &&
      rawOriginalPrice <= parsedPrice
    ) {
      const msg = `Regular price before discount (₹${rawOriginalPrice}) must be strictly greater than the selling price (₹${parsedPrice}).`;
      setErrors({ originalPrice: [msg] });
      toast.error(msg);
      setSaving(false);
      return;
    }

    const startsAtUtc =
      form.priceMode === "FIXED" && form.dealStartsAt
        ? fromIstDatetimeLocal(form.dealStartsAt)
        : null;
    const endsAtUtc =
      form.priceMode === "FIXED" && form.dealEndsAt
        ? fromIstDatetimeLocal(form.dealEndsAt)
        : null;

    const payload = {
      title: form.title,
      slug: form.slug,
      shortDescription: form.shortDescription,
      fullDescription: form.fullDescription,
      status: form.status,
      featured: form.featured,
      featuredOrder: Number(form.featuredOrder) || 0,
      priceMode: form.priceMode,
      price: parsedPrice,
      originalPrice: rawOriginalPrice,
      priceQualifier: form.priceQualifier,
      dealType: form.priceMode === "FIXED" ? form.dealType : "NONE",
      dealLabel:
        form.priceMode === "FIXED" && form.dealType === "CUSTOM"
          ? form.dealLabel.trim() || null
          : null,
      dealStartsAt: startsAtUtc,
      dealEndsAt: endsAtUtc,
      demoUrl: form.demoUrl || null,
      projectType: form.projectType || null,
      categoryId: form.categoryId,
      providerId: form.providerId,
      whatsIncluded,
      features: form.features
        .filter((f) => f.feature.trim())
        .map((f, i) => ({ feature: f.feature.trim(), sortOrder: i })),
      specifications: form.specifications
        .filter((s) => s.key.trim() && s.value.trim())
        .map((s, i) => ({ key: s.key.trim(), value: s.value.trim(), sortOrder: i })),
      faqs: form.faqs
        .filter((faq) => faq.question.trim() && faq.answer.trim())
        .map((faq, i) => ({
          question: faq.question.trim(),
          answer: faq.answer.trim(),
          sortOrder: i,
        })),
      technologyIds: form.technologyIds,
      ...(!isEditing &&
        images.length > 0 && {
          images: images.map((img, i) => ({
            url: img.url,
            storageKey: img.storageKey,
            altText: img.altText || undefined,
            isPrimary: img.isPrimary,
            sortOrder: i,
          })),
        }),
    };

    try {
      const url = isEditing
        ? `/api/admin/projects/${projectId}`
        : "/api/admin/projects";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.details) {
          setErrors(data.details);
        }
        toast.error(data.error ?? "Validation failed. Please check the form fields.");
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      toast.success(
        isEditing
          ? `Project "${form.title}" updated successfully.`
          : `Project "${form.title}" created successfully.`
      );
      router.push("/admin/projects");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const selectedProvider = providers.find((p) => p.id === form.providerId);

  const fieldClass =
    "w-full bg-white border border-[#D9E2E4] text-[#102124] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#155761] focus:ring-1 focus:ring-[#155761] placeholder:text-[#526267]/60 shadow-xs";
  const labelClass =
    "block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5";
  const errorClass = "text-rose-600 text-xs mt-1 font-medium";
  const sectionClass =
    "bg-white border border-[#D9E2E4] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs";

  if (selectorsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Loading form data…</div>
      </div>
    );
  }

  // ── Phase 3: Moderation Panel + Read-Only Content Preview for Partner-Owned Projects ──
  if (isEditing && isPartnerOwned) {
    const partnerLabel = partnerDisplayName || "Solution Partner";
    const requiresReason =
      moderationStatus === "UNPUBLISHED" || moderationStatus === "REJECTED";
    const resolvedTechLabels =
      form.technologyNames && form.technologyNames.length > 0
        ? form.technologyNames
        : technologies
            .filter((t) => form.technologyIds.includes(t.id))
            .map((t) => t.name);

    return (
      <div className="space-y-6" data-testid="partner-moderation-panel">
        {/* Phase 3 Required Ownership Banner */}
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 text-amber-950 flex items-start gap-3.5 shadow-2xs">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-amber-950">
              Managed by {partnerLabel}. Admin can only change moderation settings.
            </p>
            <p className="text-xs text-amber-900 leading-relaxed">
              Project title, descriptions, pricing, promotional offers, tech stack, features, deliverables, demo links, and screenshots are owned exclusively by {partnerLabel} and are shown below in read-only mode.
            </p>
          </div>
        </div>

        {/* Editable Moderation Panel */}
        <form onSubmit={handleSaveModeration} className={sectionClass}>
          <div className="flex items-center justify-between border-b border-[#F3F7F7] pb-3">
            <div>
              <h2 className="text-base font-bold text-[#102124]">
                Moderation Settings (Admin Whitelist)
              </h2>
              <p className="text-xs text-[#526267] mt-0.5">
                Adjust catalog visibility, featured priority, and category placement.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold">
              Owner: {partnerLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* Moderation Status */}
            <div>
              <label className={labelClass}>Moderation Status *</label>
              <select
                value={moderationStatus}
                onChange={(e) =>
                  setModerationStatus(
                    e.target.value as
                      | "PUBLISHED"
                      | "UNPUBLISHED"
                      | "REJECTED"
                      | "ARCHIVED"
                  )
                }
                className={fieldClass}
              >
                <option value="PUBLISHED">Published (Live)</option>
                <option value="UNPUBLISHED">Unpublish (Hold in Draft)</option>
                <option value="REJECTED">Reject (Hold with Reason)</option>
                <option value="ARCHIVED">Archive</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className={labelClass}>Category *</label>
              <select
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                className={fieldClass}
                required
              >
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Display Order */}
            <div>
              <label className={labelClass}>Display Priority / Order</label>
              <input
                type="number"
                value={form.featuredOrder}
                onChange={(e) => set("featuredOrder", Number(e.target.value) || 0)}
                placeholder="0"
                className={fieldClass}
              />
              <p className="text-[11px] text-[#526267] mt-1">
                Lower numbers appear higher in featured lists.
              </p>
            </div>
          </div>

          {/* Featured Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => set("featured", !form.featured)}
              className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                form.featured
                  ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-300/40 shadow-xs"
                  : "bg-[#F8FAFA] border-[#D9E2E4] hover:bg-white hover:border-[#BEDEE1]"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    form.featured
                      ? "bg-amber-400 text-amber-950 shadow-xs"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Star className={`w-5 h-5 ${form.featured ? "fill-current" : ""}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-[#102124]">
                      Featured Project Placement
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        form.featured
                          ? "bg-amber-400 text-amber-950"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {form.featured ? "Featured Active" : "Standard"}
                    </span>
                  </div>
                  <p className="text-xs text-[#526267] mt-0.5">
                    Highlight this partner solution on the homepage and featured sections.
                  </p>
                </div>
              </div>
              <div
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                  form.featured ? "bg-[#155761]" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    form.featured ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Moderation Reason (required when Unpublishing or Rejecting) */}
          <div>
            <label className={labelClass}>
              Moderation Reason / Note {requiresReason ? "*" : "(Optional)"}
            </label>
            <textarea
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
              rows={3}
              required={requiresReason}
              placeholder={
                requiresReason
                  ? "Required: explain why this project is being unpublished or rejected…"
                  : "Optional moderation note visible to the partner…"
              }
              className={fieldClass}
            />
            <p className="text-[11px] text-[#526267] mt-1">
              When a project is unpublished or rejected with a reason, a moderation hold is placed until an admin re-publishes it.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#F3F7F7]">
            <button
              type="button"
              onClick={() => router.push("/admin/projects")}
              className="px-4 py-2 text-xs font-semibold text-[#526267] hover:text-[#102124] border border-[#D9E2E4] hover:bg-[#F3F7F7] rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-bold bg-[#155761] hover:bg-[#10474F] text-white rounded-xl transition disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Saving…" : "Save Moderation Settings"}
            </button>
          </div>
        </form>

        {/* Request Changes Box (Phase 3) */}
        <div className={sectionClass}>
          <div>
            <h2 className="text-base font-bold text-[#102124]">
              Request Changes from {partnerLabel}
            </h2>
            <p className="text-xs text-[#526267] mt-0.5">
              Send a moderation note directly to the partner by email and display a &ldquo;Changes Requested&rdquo; badge on their project in the Partner Portal.
            </p>
          </div>

          <div>
            <label className={labelClass}>Requested Changes Note *</label>
            <textarea
              value={changeRequestNote}
              onChange={(e) => setChangeRequestNote(e.target.value)}
              rows={3}
              placeholder="Describe what the partner should update (e.g. broken demo link, missing architecture details, clearer screenshots)…"
              className={fieldClass}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRequestChanges}
              disabled={sendingRequestChanges}
              className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-amber-950 rounded-xl transition disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              {sendingRequestChanges ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>
                {sendingRequestChanges ? "Sending…" : "Request Changes & Email Partner"}
              </span>
            </button>
          </div>
        </div>

        {/* Read-Only Preview of Partner Content (No inputs rendered) */}
        <div className={sectionClass} data-testid="partner-readonly-preview">
          <div className="flex items-center justify-between border-b border-[#F3F7F7] pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#155761]" />
              <h2 className="text-base font-bold text-[#102124]">
                Read-Only Content Preview (Partner Managed)
              </h2>
            </div>
            {form.demoUrl && (
              <a
                href={form.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-[#155761] hover:underline inline-flex items-center gap-1"
              >
                <span>Live Demo</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="space-y-5 text-sm text-[#102124]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#526267] block">
                Title &amp; Slug
              </span>
              <p className="text-lg font-bold text-[#102124] mt-0.5">{form.title}</p>
              <p className="text-xs font-mono text-[#526267]">/projects/{form.slug}</p>
            </div>

            {/* Read-only PriceBlock */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#526267] block mb-1.5">
                Partner Pricing &amp; Active Offer
              </span>
              <div className="p-4 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] inline-block min-w-[260px]">
                <PriceBlock
                  priceMode={form.priceMode}
                  price={form.price ? Number(form.price) : null}
                  originalPrice={form.originalPrice ? Number(form.originalPrice) : null}
                  priceQualifier={form.priceQualifier}
                  dealType={form.dealType}
                  dealLabel={form.dealLabel}
                  dealStartsAt={fromIstDatetimeLocal(form.dealStartsAt)}
                  dealEndsAt={fromIstDatetimeLocal(form.dealEndsAt)}
                  variant="compact"
                />
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#526267] block">
                Short Description
              </span>
              <p className="text-xs text-[#526267] mt-1 leading-relaxed">
                {form.shortDescription}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#526267] block">
                Full Description
              </span>
              <div className="mt-1 p-4 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] text-xs text-[#102124] whitespace-pre-wrap leading-relaxed">
                {form.fullDescription}
              </div>
            </div>

            {/* Read-only Technologies */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#526267] block mb-1.5">
                Technologies ({resolvedTechLabels.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {resolvedTechLabels.length > 0 ? (
                  resolvedTechLabels.map((name) => (
                    <span
                      key={name}
                      className="px-2.5 py-1 rounded-lg bg-[#F3F7F7] border border-[#D9E2E4] text-xs font-semibold text-[#155761]"
                    >
                      {name}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#526267] italic">None listed</span>
                )}
              </div>
            </div>

            {/* Read-only What's Included & Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#526267] block mb-2">
                  What&apos;s Included ({form.whatsIncluded.length})
                </span>
                <ul className="space-y-1.5 text-xs text-[#102124]">
                  {form.whatsIncluded.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2F7D78] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#526267] block mb-2">
                  Key Features ({form.features.length})
                </span>
                <ul className="space-y-1.5 text-xs text-[#102124]">
                  {form.features.map((f) => (
                    <li key={f.id} className="flex items-start gap-1.5">
                      <span className="text-[#155761] font-bold">•</span>
                      <span>{f.feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Read-only Screenshots */}
            {images.length > 0 && (
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#526267] block mb-2">
                  Partner Screenshots ({images.length})
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-video rounded-xl overflow-hidden border border-[#D9E2E4] bg-[#F8FAFA]"
                    >
                      <Image
                        src={img.url}
                        alt={img.altText || form.title}
                        fill
                        sizes="200px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Standard Admin-Managed Project Form ──────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ── Section: Basic Info ─────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className="text-base font-bold text-[#102124]">Basic Information</h2>

        {/* Title */}
        <div>
          <label className={labelClass}>Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. E-Commerce Store with Admin Dashboard"
            className={fieldClass}
            required
          />
          {errors.title?.map((e) => (
            <p key={e} className={errorClass}>
              {e}
            </p>
          ))}
        </div>

        {/* Slug */}
        <div>
          <label className={labelClass}>Slug *</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              set("slug", e.target.value);
            }}
            placeholder="e.g. ecommerce-store-admin-dashboard"
            className={fieldClass}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            URL: /projects/{form.slug || "…"}
          </p>
          {errors.slug?.map((e) => (
            <p key={e} className={errorClass}>
              {e}
            </p>
          ))}
        </div>

        {/* Short Description */}
        <div>
          <label className={labelClass}>Short Description * (10–300 chars)</label>
          <textarea
            value={form.shortDescription}
            onChange={(e) => set("shortDescription", e.target.value)}
            rows={2}
            placeholder="One or two sentences shown in the project card."
            className={fieldClass}
            required
          />
          <p className="text-xs text-gray-500 mt-1">{form.shortDescription.length}/300</p>
          {errors.shortDescription?.map((e) => (
            <p key={e} className={errorClass}>
              {e}
            </p>
          ))}
        </div>

        {/* Full Description */}
        <div>
          <label className={labelClass}>Full Description * (min 50 chars)</label>
          <textarea
            value={form.fullDescription}
            onChange={(e) => set("fullDescription", e.target.value)}
            rows={8}
            placeholder="Detailed project description shown on the detail page."
            className={fieldClass}
            required
          />
          {errors.fullDescription?.map((e) => (
            <p key={e} className={errorClass}>
              {e}
            </p>
          ))}
        </div>

        {/* Row: Category + Provider */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Category *</label>
            <select
              value={form.categoryId}
              onChange={(e) => set("categoryId", e.target.value)}
              className={fieldClass}
              required
            >
              <option value="">Select a category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.categoryId?.map((e) => (
              <p key={e} className={errorClass}>
                {e}
              </p>
            ))}
          </div>

          <div>
            <label className={labelClass}>Provider *</label>
            <select
              value={form.providerId}
              onChange={(e) => set("providerId", e.target.value)}
              className={fieldClass}
              required
            >
              <option value="">Select a provider…</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.displayName}
                </option>
              ))}
            </select>
            {errors.providerId?.map((e) => (
              <p key={e} className={errorClass}>
                {e}
              </p>
            ))}
          </div>
        </div>

        {/* Provider info preview */}
        {selectedProvider && (
          <div className="bg-[#F8FAFA] border border-[#D9E2E4] rounded-xl p-3 text-xs text-[#526267]">
            <p className="text-[#102124] font-bold">{selectedProvider.displayName}</p>
            <p>Email: {selectedProvider.email}</p>
            {selectedProvider.whatsappNumber && (
              <p>WhatsApp: {selectedProvider.whatsappNumber}</p>
            )}
          </div>
        )}

        {/* Row: Type + Demo URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Project Type</label>
            <input
              type="text"
              value={form.projectType}
              onChange={(e) => set("projectType", e.target.value)}
              placeholder="e.g. Web Application"
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Demo URL</label>
            <input
              type="url"
              value={form.demoUrl}
              onChange={(e) => set("demoUrl", e.target.value)}
              placeholder="https://demo.example.com"
              className={fieldClass}
            />
            {errors.demoUrl?.map((e) => (
              <p key={e} className={errorClass}>
                {e}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section: Status & Visibility ───────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className="text-base font-bold text-[#102124]">Status &amp; Visibility</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                set("status", e.target.value as ProjectFormData["status"])
              }
              className={fieldClass}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Featured Display Order</label>
            <input
              type="number"
              value={form.featuredOrder}
              onChange={(e) => set("featuredOrder", Number(e.target.value) || 0)}
              placeholder="0"
              className={fieldClass}
            />
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="button"
              onClick={() => set("featured", !form.featured)}
              className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 select-none ${
                form.featured
                  ? "bg-amber-50/80 border-amber-300 ring-2 ring-amber-300/40 shadow-xs"
                  : "bg-[#F8FAFA] border-[#D9E2E4] hover:bg-white hover:border-[#BEDEE1]"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    form.featured
                      ? "bg-amber-400 text-amber-950 shadow-xs"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <Star className={`w-5 h-5 ${form.featured ? "fill-current" : ""}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-[#102124]">
                      Featured Project Status
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        form.featured
                          ? "bg-amber-400 text-amber-950"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {form.featured ? "Featured Active" : "Standard Listing"}
                    </span>
                  </div>
                  <p className="text-xs text-[#526267] mt-0.5 leading-relaxed">
                    {form.featured
                      ? "Featured badge active. This project is highlighted on the homepage hero, catalog top recommendations, and filter views."
                      : "Standard catalog listing. Click anywhere on this card to enable the Featured badge."}
                  </p>
                </div>
              </div>

              <div
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                  form.featured ? "bg-[#155761]" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    form.featured ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── Section: Pricing & Promotional Offers (Shared Phase 4 Component) ── */}
      <div className={sectionClass}>
        <div>
          <h2 className="text-base font-bold text-[#102124]">
            Pricing &amp; Promotional Offers
          </h2>
          <p className="text-xs text-[#526267] mt-0.5">
            Configure the pricing model, qualifier, and optional promotional deal schedule.
          </p>
        </div>

        <PricingOffersFields
          value={{
            priceMode: form.priceMode,
            price: form.price,
            originalPrice: form.originalPrice,
            priceQualifier: form.priceQualifier,
            dealType: form.dealType,
            dealLabel: form.dealLabel,
            dealStartsAt: form.dealStartsAt,
            dealEndsAt: form.dealEndsAt,
          }}
          onChange={(patch: Partial<PricingOffersFormState>) => {
            setForm((prev) => ({ ...prev, ...patch }));
          }}
          serverErrors={errors}
        />
      </div>

      {/* ── Section: Technologies ────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className="text-base font-bold text-[#102124]">Technologies</h2>
        <div className="flex flex-wrap gap-2">
          {technologies.map((tech) => {
            const selected = form.technologyIds.includes(tech.id);
            return (
              <button
                key={tech.id}
                type="button"
                onClick={() => toggleTechnology(tech.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition cursor-pointer ${
                  selected
                    ? "bg-[#155761] border-[#155761] text-white shadow-xs"
                    : "bg-[#F8FAFA] border-[#D9E2E4] text-[#526267] hover:border-[#155761]/50 hover:text-[#102124]"
                }`}
              >
                {tech.name}
              </button>
            );
          })}
          {technologies.length === 0 && (
            <p className="text-xs text-[#526267] italic">
              No technologies available. Add them in the Technologies admin section.
            </p>
          )}
        </div>
      </div>

      {/* ── Section: What's Included ─────────────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className="text-base font-bold text-[#102124]">What&apos;s Included</h2>
        <p className="text-xs text-[#526267]">One item per line (max 20 items).</p>
        <textarea
          value={whatsIncludedInput}
          onChange={(e) => setWhatsIncludedInput(e.target.value)}
          rows={5}
          placeholder={"Source code\nDeployment guide\n6 months support"}
          className={fieldClass}
        />
      </div>

      {/* ── Section: Features ────────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className="text-base font-bold text-[#102124]">Features</h2>
        <ListEditor
          label="Feature list"
          items={form.features}
          onAdd={addFeature}
          onRemove={removeFeature}
          renderItem={(item) => (
            <input
              type="text"
              value={item.feature}
              onChange={(e) => updateFeature(item.id, e.target.value)}
              placeholder="e.g. User authentication with JWT"
              className={fieldClass}
            />
          )}
        />
      </div>

      {/* ── Section: Specifications ──────────────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className="text-base font-bold text-[#102124]">Specifications</h2>
        <ListEditor
          label="Specification table"
          items={form.specifications}
          onAdd={addSpec}
          onRemove={removeSpec}
          renderItem={(item) => (
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={item.key}
                onChange={(e) => updateSpec(item.id, "key", e.target.value)}
                placeholder="Label (e.g. Database)"
                className={fieldClass}
              />
              <input
                type="text"
                value={item.value}
                onChange={(e) => updateSpec(item.id, "value", e.target.value)}
                placeholder="Value (e.g. PostgreSQL)"
                className={fieldClass}
              />
            </div>
          )}
        />
      </div>

      {/* ── Section: FAQs ────────────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className="text-base font-bold text-[#102124]">Frequently Asked Questions</h2>
        <ListEditor
          label="FAQ list"
          items={form.faqs}
          onAdd={addFaq}
          onRemove={removeFaq}
          renderItem={(item) => (
            <div className="space-y-2">
              <input
                type="text"
                value={item.question}
                onChange={(e) => updateFaq(item.id, "question", e.target.value)}
                placeholder="Question"
                className={fieldClass}
              />
              <textarea
                value={item.answer}
                onChange={(e) => updateFaq(item.id, "answer", e.target.value)}
                placeholder="Answer"
                rows={2}
                className={fieldClass}
              />
            </div>
          )}
        />
      </div>

      {/* ── Section: Project Images ──────────────────────────────────────────── */}
      <div className={sectionClass}>
        <ImageUploader
          projectId={projectId}
          initialImages={images}
          onImagesChange={setImages}
        />
      </div>

      {/* ── Submit Bar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#D9E2E4]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/projects")}
            className="px-4 py-2 text-sm text-[#526267] hover:text-[#102124] border border-[#D9E2E4] hover:bg-[#F3F7F7] rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          {isEditing && projectId && (
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 text-sm text-rose-600 hover:text-white border border-rose-200 hover:border-rose-600 hover:bg-rose-600 rounded-xl transition cursor-pointer font-medium flex items-center gap-1.5 shadow-2xs"
            >
              <Trash2 className="w-4 h-4" />
              Delete Project
            </button>
          )}
        </div>

        <div className="flex gap-3">
          {!isEditing && form.status !== "DRAFT" && (
            <button
              type="button"
              onClick={() => {
                set("status", "DRAFT");
                setTimeout(
                  () => document.querySelector<HTMLButtonElement>("[data-submit]")?.click(),
                  50
                );
              }}
              disabled={saving}
              className="px-4 py-2 text-sm bg-white hover:bg-[#F3F7F7] text-[#102124] border border-[#D9E2E4] rounded-xl transition disabled:opacity-50 cursor-pointer shadow-xs font-medium"
            >
              Save as Draft
            </button>
          )}

          <button
            type="submit"
            data-submit
            disabled={saving}
            className="px-6 py-2 text-sm bg-[#155761] hover:bg-[#10474F] text-white rounded-xl font-semibold transition disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
          >
            {saving && (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {saving ? "Saving…" : isEditing ? "Update Project" : "Create Project"}
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#D9E2E4] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-base font-bold text-rose-700 mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              Delete Project
            </h3>
            <p className="text-xs text-[#526267] mb-6 leading-relaxed">
              Are you sure you want to permanently delete{" "}
              <strong className="text-[#102124] font-semibold">
                {form.title || "this project"}
              </strong>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-[#526267] border border-[#D9E2E4] hover:bg-[#F3F7F7] rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deleting}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
