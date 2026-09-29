// components/custom-project/CustomProjectForm.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CheckCircle2, AlertCircle, ArrowLeft, Send, Lock } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
  const sessionContext = useSession();
  const session = sessionContext?.data;
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

  React.useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || session.user?.name || "",
        email: prev.email || session.user?.email || "",
      }));
    }
  }, [session]);

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

    if (!session?.user) {
      setErrorMessage("Please sign in before submitting your custom software build request.");
      setIsLoading(false);
      return;
    }

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
      <div className="bg-white rounded-2xl border border-[#D9E2E4] p-8 sm:p-12 text-center shadow-xs">
        <div className="w-16 h-16 rounded-full bg-[#DDF4EC] text-[#2F7D78] border border-[#2F7D78]/25 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-[#102124]">
          Request Received Successfully!
        </h2>
        <p className="mt-3 text-sm text-[#526267] max-w-md mx-auto leading-relaxed">
          Thank you for trusting <strong>Soft Showcase</strong> with your software vision.
          Our team will analyze your requirements and reach out via email or WhatsApp soon.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/"
            className={buttonVariants({
              variant: "outline",
              className: "gap-2",
            })}
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Homepage
          </Link>
          <Link
            href="/projects"
            className={buttonVariants({ variant: "primary" })}
          >
            Explore Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-10 shadow-xs space-y-8"
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

      {!session?.user && (
        <div className="p-4 rounded-xl bg-[#F8FAFA] border border-[#D9E2E4] text-[#102124] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm">
            <Lock className="w-4 h-4 text-[#155761] shrink-0" />
            <span>
              <strong>Authentication required:</strong> Please sign in to submit a custom software build request.
            </span>
          </div>
          <Link
            href="/login?callbackUrl=/custom-project"
            className={buttonVariants({
              variant: "primary",
              size: "sm",
              className: "shrink-0",
            })}
          >
            Sign In to Continue
          </Link>
        </div>
      )}

      {/* ── Section: Contact Details ────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-semibold text-[#102124] pb-2 border-b border-[#F3F7F7] mb-4">
          1. Your Contact Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="text-[#102124]">Full Name *</Label>
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
            <Label htmlFor="email" className="text-[#102124]">Email Address *</Label>
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
            <Label htmlFor="whatsapp" className="text-[#102124]">WhatsApp Number (Optional)</Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="+1234567890 (Include country code)"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="mt-1.5"
            />
            <p className="text-xs text-[#526267] mt-1">
              Provide this if you prefer rapid direct communication via WhatsApp.
            </p>
          </div>
        </div>
      </div>

      {/* ── Section: Project Overview ───────────────────────────────────── */}
      <div>
        <h3 className="text-base font-semibold text-[#102124] pb-2 border-b border-[#F3F7F7] mb-4">
          2. Project Overview
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="projectTitle" className="text-[#102124]">Project Title / Name *</Label>
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
            <Label htmlFor="category" className="text-[#102124]">Category *</Label>
            <select
              id="category"
              className="mt-1.5 flex h-10 w-full rounded-lg border border-[#D9E2E4] bg-white px-3 py-2 text-sm text-[#102124] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#155761] focus-visible:border-[#155761]"
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
            <Label className="text-[#102124]">Preferred Technologies (Select relevant tags)</Label>
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
                        ? "bg-[#155761] text-white border-[#155761] shadow-xs"
                        : "bg-[#F3F7F7] text-[#526267] border-[#D9E2E4] hover:bg-[#EEF3F4] hover:text-[#102124]"
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
        <h3 className="text-base font-semibold text-[#102124] pb-2 border-b border-[#F3F7F7] mb-4">
          3. Detailed Requirements
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center">
              <Label htmlFor="description" className="text-[#102124]">Detailed Description *</Label>
              <span className="text-xs text-[#526267]">
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
            <Label htmlFor="requiredFeatures" className="text-[#102124]">Required Features (Must-Haves) *</Label>
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
        <h3 className="text-base font-semibold text-[#102124] pb-2 border-b border-[#F3F7F7] mb-4">
          4. Budget & Timeline (Optional)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budget" className="text-[#102124]">Target Budget</Label>
            <Input
              id="budget"
              placeholder="e.g. $1,000 - $3,000 or Flexible"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="deadline" className="text-[#102124]">Target Deadline</Label>
            <Input
              id="deadline"
              placeholder="e.g. Within 1 month, Q2 2027"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="additionalRequirements" className="text-[#102124]">Additional Notes or Links</Label>
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

      <div className="pt-4 border-t border-[#D9E2E4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-xs text-[#526267]">
          Strict confidentiality. Your project idea is safe with our team.
        </p>
        {!session?.user ? (
          <Link
            href="/login?callbackUrl=/custom-project"
            className={buttonVariants({
              size: "lg",
              className: "gap-2 shadow-xs cursor-pointer w-full sm:w-auto",
            })}
          >
            <Lock className="w-4 h-4" />
            Sign In to Submit Request
          </Link>
        ) : (
          <Button
            type="submit"
            size="lg"
            isLoading={isLoading}
            className="gap-2 shadow-xs cursor-pointer w-full sm:w-auto"
          >
            <Send className="w-4 h-4" />
            Submit Custom Request
          </Button>
        )}
      </div>
    </form>
  );
}
