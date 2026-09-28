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

  // Selected tech stack
  const [selectedTechs, setSelectedTechs] = React.useState<string[]>(
    initialData?.technologies?.map((t: any) => t.technologyId || t.id) ||
      (technologies.slice(0, 3).map((t) => t.id))
  );

  // Primary image
  const [imageUrl, setImageUrl] = React.useState(
    initialData?.images?.[0]?.url ||
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop"
  );

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleToggleTech = (id: string) => {
    setSelectedTechs((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        categoryId,
        shortDescription: shortDescription.trim(),
        fullDescription: fullDescription.trim(),
        priceMode,
        price: priceMode === "CONTACT" ? 0 : Number(price) || 0,
        demoUrl: demoUrl.trim() || null,
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
        images: [
          {
            url: imageUrl.trim(),
            storageKey: `partner-sol-${Date.now()}`,
            altText: title.trim(),
            isPrimary: true,
            sortOrder: 1,
          },
        ],
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
        throw new Error(resData.error || "Failed to save solution");
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
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── 1. Basic Metadata ─────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          1. Solution Overview &amp; Category
        </h2>

        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold text-[#102124]">Solution Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Multi-Tenant E-Commerce Core & Vendor Payout Engine"
              required
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold text-[#102124]">Primary Category *</Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-[#102124]">Architecture Type *</Label>
              <Input
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                placeholder="e.g. Next.js SaaS, Python Flask / ML, PHP E-Commerce"
                required
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-[#102124]">Short Teaser Description (Max 200 chars) *</Label>
            <Input
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="High-level value proposition displayed on cards..."
              maxLength={200}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-[#102124]">Detailed Architecture &amp; Solution Overview *</Label>
            <Textarea
              value={fullDescription}
              onChange={(e) => setFullDescription(e.target.value)}
              placeholder="Explain features, target buyers, technology highlights, installation prerequisites..."
              rows={5}
              required
              className="mt-1 text-xs"
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-[#102124]">Live Demo URL (Optional)</Label>
            <Input
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              placeholder="https://demo.yourdomain.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold text-[#102124]">Primary Preview Image URL *</Label>
            <Input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              required
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* ── 3. Tech Stack Tags ────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          3. Tech Stack Tags
        </h2>

        <div className="flex flex-wrap gap-2 pt-2">
          {technologies.map((t) => {
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
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Deliverables ("What's Included") ───────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          4. Package Deliverables (&quot;What&apos;s Included&quot;)
        </h2>

        <div className="flex gap-2">
          <Input
            value={newDeliverable}
            onChange={(e) => setNewDeliverable(e.target.value)}
            placeholder="e.g. Complete source code with documentation"
            className="text-xs"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleAddDeliverable}>
            Add
          </Button>
        </div>

        <ul className="space-y-2 pt-2">
          {whatsIncluded.map((item, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] text-xs"
            >
              <span className="text-[#102124]">{item}</span>
              <button
                type="button"
                onClick={() => handleRemoveDeliverable(idx)}
                className="text-rose-500 hover:text-rose-700 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ── 5. Features & Key Capabilities ───────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          5. Key Architectural Features
        </h2>

        <div className="flex gap-2">
          <Input
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            placeholder="e.g. Instant ATS score calculation and AI gap detection"
            className="text-xs"
          />
          <Button type="button" variant="outline" size="sm" onClick={handleAddFeature}>
            Add Feature
          </Button>
        </div>

        <ul className="space-y-2 pt-2">
          {features.map((item, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] text-xs"
            >
              <span className="text-[#102124]">{item.feature}</span>
              <button
                type="button"
                onClick={() => handleRemoveFeature(idx)}
                className="text-rose-500 hover:text-rose-700 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ── 6. Technical Specifications ──────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          6. Technical Specifications
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Input
            value={specKey}
            onChange={(e) => setSpecKey(e.target.value)}
            placeholder="Specification Key (e.g. Frontend)"
            className="text-xs"
          />
          <div className="flex gap-2">
            <Input
              value={specVal}
              onChange={(e) => setSpecVal(e.target.value)}
              placeholder="Value (e.g. Next.js 15, Tailwind CSS)"
              className="text-xs"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddSpec}>
              Add
            </Button>
          </div>
        </div>

        <ul className="space-y-2 pt-2">
          {specifications.map((item, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] text-xs"
            >
              <div>
                <strong className="text-[#102124]">{item.key}:</strong>{" "}
                <span className="text-[#526267]">{item.value}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveSpec(idx)}
                className="text-rose-500 hover:text-rose-700 p-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ── 7. Frequently Asked Questions ─────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          7. Buyer FAQs
        </h2>

        <div className="space-y-2">
          <Input
            value={faqQ}
            onChange={(e) => setFaqQ(e.target.value)}
            placeholder="Question: e.g. How do I deploy this to production?"
            className="text-xs"
          />
          <div className="flex gap-2">
            <Input
              value={faqA}
              onChange={(e) => setFaqA(e.target.value)}
              placeholder="Answer: Full Docker instructions are included in the repo."
              className="text-xs"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddFaq}>
              Add FAQ
            </Button>
          </div>
        </div>

        <ul className="space-y-2 pt-2">
          {faqs.map((item, idx) => (
            <li
              key={idx}
              className="p-3 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] text-xs space-y-1 relative"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-[#102124]">{item.question}</p>
                <button
                  type="button"
                  onClick={() => handleRemoveFaq(idx)}
                  className="text-rose-500 hover:text-rose-700 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[#526267]">{item.answer}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Bottom Submit Toolbar ─────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Link href="/partner/solutions">
          <Button variant="outline" size="md">
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={loading}
          className="font-bold shadow-md"
        >
          {isEditing ? "Update Solution" : "Save and Publish Solution"}
        </Button>
      </div>
    </form>
  );
}
