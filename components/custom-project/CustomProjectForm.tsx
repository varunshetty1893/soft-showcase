// components/custom-project/CustomProjectForm.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DEFAULT_CATEGORIES } from "@/config/categories";

const POPULAR_TECHNOLOGIES = [
  "Next.js",
  "React",
  "Node.js",
  "TypeScript",
  "Python",
  "FastAPI",
  "PostgreSQL",
  "Tailwind CSS",
  "Flutter",
  "React Native",
  "Docker",
  "OpenAI / LLM",
];

export function CustomProjectForm() {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    whatsapp: "",
    projectTitle: "",
    category: "web-application",
    technologyPreferences: [] as string[],
    description: "",
    requiredFeatures: "",
    deadline: "",
    budget: "",
    additionalRequirements: "",
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const toggleTechnology = (tech: string) => {
    setFormData((prev) => {
      const exists = prev.technologyPreferences.includes(tech);
      if (exists) {
        return {
          ...prev,
          technologyPreferences: prev.technologyPreferences.filter((t) => t !== tech),
        };
      } else {
        if (prev.technologyPreferences.length >= 10) return prev;
        return {
          ...prev,
          technologyPreferences: [...prev.technologyPreferences, tech],
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // Basic client validation
    if (formData.description.trim().length < 50) {
      setErrorMessage("Description must be at least 50 characters long.");
      setIsLoading(false);
      return;
    }

    if (formData.requiredFeatures.trim().length < 10) {
      setErrorMessage("Required features must be at least 10 characters long.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/custom-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit custom project request.");
      }

      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center shadow-xs">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Request Received Successfully!
        </h2>
        <p className="mt-3 text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
          Thank you for trusting <strong>Soft Showcase</strong> with your software vision.
          Our team will analyze your requirements and reach out via email or WhatsApp soon.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Return to Homepage
            </Button>
          </Link>
          <Link href="/projects">
            <Button variant="primary">
              Explore Catalog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 shadow-xs space-y-8"
    >
      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
          <div>
            <p className="font-medium">Error submitting request</p>
            <p className="text-xs text-red-600 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* ── Section: Contact Details ────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 mb-4">
          1. Your Contact Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              required
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="whatsapp">WhatsApp Number (Optional)</Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="+1234567890 (Include country code)"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="mt-1.5"
            />
            <p className="text-xs text-gray-500 mt-1">
              Provide this if you prefer rapid direct communication via WhatsApp.
            </p>
          </div>
        </div>
      </div>

      {/* ── Section: Project Overview ───────────────────────────────────── */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 mb-4">
          2. Project Overview
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="projectTitle">Project Title / Name *</Label>
            <Input
              id="projectTitle"
              required
              placeholder="e.g. B2B Multi-tenant SaaS Platform"
              value={formData.projectTitle}
              onChange={(e) => setFormData({ ...formData, projectTitle: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              className="mt-1.5 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:border-transparent"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {DEFAULT_CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name} — {cat.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Preferred Technologies (Select relevant tags)</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {POPULAR_TECHNOLOGIES.map((tech) => {
                const selected = formData.technologyPreferences.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTechnology(tech)}
                    className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      selected
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {tech}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section: Technical Requirements ─────────────────────────────── */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 mb-4">
          3. Detailed Requirements
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center">
              <Label htmlFor="description">Detailed Description *</Label>
              <span className="text-xs text-gray-400">
                {formData.description.length} / 50 min characters
              </span>
            </div>
            <Textarea
              id="description"
              required
              rows={4}
              placeholder="Describe what the software should do, target users, problem it solves, and core workflow..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="requiredFeatures">Required Features (Must-Haves) *</Label>
            <Textarea
              id="requiredFeatures"
              required
              rows={3}
              placeholder="List critical features (e.g. 1. Stripe subscription, 2. Role-based permissions, 3. Real-time notifications)..."
              value={formData.requiredFeatures}
              onChange={(e) => setFormData({ ...formData, requiredFeatures: e.target.value })}
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      {/* ── Section: Scope & Budget ─────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-100 mb-4">
          4. Budget & Timeline (Optional)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budget">Target Budget</Label>
            <Input
              id="budget"
              placeholder="e.g. $1,000 - $3,000 or Flexible"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="deadline">Target Deadline</Label>
            <Input
              id="deadline"
              placeholder="e.g. Within 1 month, Q2 2027"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="additionalRequirements">Additional Notes or Links</Label>
            <Textarea
              id="additionalRequirements"
              rows={2}
              placeholder="Figma links, reference websites, specific API integrations, etc."
              value={formData.additionalRequirements}
              onChange={(e) =>
                setFormData({ ...formData, additionalRequirements: e.target.value })
              }
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Strict confidentiality. Your project idea is safe with our team.
        </p>
        <Button
          type="submit"
          size="lg"
          isLoading={isLoading}
          className="gap-2 shadow-sm"
        >
          <Send className="w-4 h-4" />
          Submit Custom Request
        </Button>
      </div>
    </form>
  );
}
