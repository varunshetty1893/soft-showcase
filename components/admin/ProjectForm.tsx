"use client";
// components/admin/ProjectForm.tsx
// Reusable form for creating and editing projects.
// Handles: basic info, pricing, lists (features, specs, FAQs), technology selection, images.

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Star } from "lucide-react";
import { ImageUploader, type ProjectImageItem } from "@/components/admin/ImageUploader";

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

type ProjectFormData = {
  // Core
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  featured: boolean;
  // Pricing
  priceMode: "CONTACT" | "FIXED" | "STARTING_FROM" | "FREE";
  price: string;
  originalPrice: string;
  // Details
  demoUrl: string;
  projectType: string;
  categoryId: string;
  providerId: string;
  // Lists
  whatsIncluded: string[];
  features: FeatureItem[];
  specifications: SpecItem[];
  faqs: FaqItem[];
  technologyIds: string[];
};

type ProjectFormProps = {
  /** Pass existing project data to populate an edit form */
  initialData?: Partial<ProjectFormData>;
  /** ID of the project being edited (undefined for new) */
  projectId?: string;
  /** Existing images for the project (edit mode only) */
  initialImages?: ProjectImageItem[];
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
  priceMode: "CONTACT",
  price: "",
  originalPrice: "",
  demoUrl: "",
  projectType: "",
  categoryId: "",
  providerId: "",
  whatsIncluded: [],
  features: [],
  specifications: [],
  faqs: [],
  technologyIds: [],
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
        <label className="block text-xs font-semibold text-[#102124] uppercase tracking-wider">{label}</label>
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
                // Handled externally by parent's onChange callback
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

export default function ProjectForm({ initialData, projectId, initialImages }: ProjectFormProps) {
  const router = useRouter();
  const isEditing = !!projectId;

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState<ProjectFormData>({ ...EMPTY, ...initialData });
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(isEditing);
  const [whatsIncludedInput, setWhatsIncludedInput] = useState(
    initialData?.whatsIncluded?.join("\n") ?? ""
  );

  // ── Selector data ────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState<Category[]>([]);
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectorsLoading, setSelectorsLoading] = useState(true);

  // ── Submission state ─────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
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
      router.push("/admin/projects");
      router.refresh();
    } catch (err: any) {
      setGlobalError(err?.message || "Failed to delete project. Please try again.");
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
        setCategories(data.categories);
        setTechnologies(data.technologies);
        setProviders(data.providers);
      } catch {
        setGlobalError("Failed to load form data. Please refresh the page.");
      } finally {
        setSelectorsLoading(false);
      }
    }
    loadSelectors();
  }, []);

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

  // ── Submit ────────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setGlobalError(null);

    // Parse whatsIncluded from textarea
    const whatsIncluded = whatsIncludedInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: form.title,
      slug: form.slug,
      shortDescription: form.shortDescription,
      fullDescription: form.fullDescription,
      status: form.status,
      featured: form.featured,
      priceMode: form.priceMode,
      price:
        form.priceMode === "FIXED" || form.priceMode === "STARTING_FROM"
          ? parseFloat(form.price) || null
          : null,
      originalPrice:
        form.priceMode === "FIXED" && form.originalPrice && form.originalPrice.trim() !== ""
          ? parseFloat(form.originalPrice) || null
          : null,
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

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setErrors(data.details);
        } else {
          setGlobalError(data.error ?? "An error occurred. Please try again.");
        }
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      router.push("/admin/projects");
      router.refresh();
    } catch {
      setGlobalError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Provider info preview ────────────────────────────────────────────────────
  const selectedProvider = providers.find((p) => p.id === form.providerId);

  // ── Render ───────────────────────────────────────────────────────────────────
  const fieldClass =
    "w-full bg-white border border-[#D9E2E4] text-[#102124] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-[#155761] focus:ring-1 focus:ring-[#155761] placeholder:text-[#526267]/60 shadow-xs";
  const labelClass = "block text-xs font-semibold text-[#102124] uppercase tracking-wider mb-1.5";
  const errorClass = "text-rose-600 text-xs mt-1 font-medium";
  const sectionClass = "bg-white border border-[#D9E2E4] rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs";

  if (selectorsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400">Loading form data…</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Global error */}
      {globalError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-4 py-3 text-xs flex items-center gap-2">
          <span>{globalError}</span>
        </div>
      )}

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
          {errors.title?.map((e) => <p key={e} className={errorClass}>{e}</p>)}
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
          {errors.slug?.map((e) => <p key={e} className={errorClass}>{e}</p>)}
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
          {errors.shortDescription?.map((e) => <p key={e} className={errorClass}>{e}</p>)}
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
          {errors.fullDescription?.map((e) => <p key={e} className={errorClass}>{e}</p>)}
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
            {errors.categoryId?.map((e) => <p key={e} className={errorClass}>{e}</p>)}
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
            {errors.providerId?.map((e) => <p key={e} className={errorClass}>{e}</p>)}
          </div>
        </div>

        {/* Provider info preview */}
        {selectedProvider && (
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3 text-sm">
            <p className="text-blue-300 font-medium">{selectedProvider.displayName}</p>
            <p className="text-gray-400">📧 {selectedProvider.email}</p>
            {selectedProvider.whatsappNumber && (
              <p className="text-gray-400">📱 {selectedProvider.whatsappNumber}</p>
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
            {errors.demoUrl?.map((e) => <p key={e} className={errorClass}>{e}</p>)}
          </div>
        </div>
      </div>

      {/* ── Section: Status & Visibility ───────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className="text-base font-bold text-[#102124]">Status & Visibility</h2>

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

          <div className="sm:col-span-2 pt-2">
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

              {/* Interactive toggle switch */}
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

      {/* ── Section: Pricing ────────────────────────────────────────────────── */}
      <div className={sectionClass}>
        <h2 className="text-base font-bold text-[#102124]">Pricing</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Price Mode</label>
            <select
              value={form.priceMode}
              onChange={(e) =>
                set("priceMode", e.target.value as ProjectFormData["priceMode"])
              }
              className={fieldClass}
            >
              <option value="CONTACT">Contact for Price</option>
              <option value="FIXED">Fixed Price</option>
              <option value="STARTING_FROM">Starting From</option>
              <option value="FREE">Free</option>
            </select>
          </div>

          {(form.priceMode === "FIXED" || form.priceMode === "STARTING_FROM") && (
            <div>
              <label className={labelClass}>Price (₹) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="e.g. 4999"
                className={fieldClass}
              />
              {errors.price?.map((e) => <p key={e} className={errorClass}>{e}</p>)}
            </div>
          )}

          {form.priceMode === "FIXED" && (
            <div>
              <label className={labelClass}>
                Original Price (₹) (Optional — only if previously sold/listed at this price)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.originalPrice}
                onChange={(e) => set("originalPrice", e.target.value)}
                placeholder="Must be higher than selling price"
                className={fieldClass}
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Leave blank if no prior verifiable price exists. Never invent discounts.
              </p>
              {errors.originalPrice?.map((e) => <p key={e} className={errorClass}>{e}</p>)}
            </div>
          )}
        </div>
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
            <p className="text-xs text-[#526267] italic">No technologies available. Add them in the Technologies admin section.</p>
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
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[#102124]">Project Screenshots</h2>
          {!projectId && (
            <span className="text-xs text-[#526267]">
              Save the project first, then add images
            </span>
          )}
        </div>

        {projectId ? (
          <ImageUploader
            projectId={projectId}
            initialImages={initialImages}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-[#D9E2E4] rounded-2xl gap-2 bg-[#F8FAFA]">
            <svg
              className="w-10 h-10 text-[#526267]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs text-[#526267]">
              Create the project, then upload screenshots from the edit page.
            </p>
          </div>
        )}
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
          {/* Save as Draft shortcut */}
          {!isEditing && form.status !== "DRAFT" && (
            <button
              type="button"
              onClick={() => {
                set("status", "DRAFT");
                setTimeout(
                  () => document.querySelector<HTMLButtonElement>('[data-submit]')?.click(),
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
              Are you sure you want to permanently delete this project? This will remove all associated media, specifications, features, and inquiries. This action cannot be undone.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-3.5 py-1.5 rounded-xl border border-[#D9E2E4] text-xs font-medium text-[#526267] hover:bg-[#F3F7F7] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deleting}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
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
