// components/custom-project/CustomProjectForm.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CheckCircle2, AlertCircle, ArrowLeft, Send } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DEFAULT_CATEGORIES } from "@/config/categories";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/security/TurnstileWidget";

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

export interface CustomProjectInitialContact {
  name?: string;
  email?: string;
  whatsapp?: string;
}

export function CustomProjectForm({
  initialContact,
}: {
  initialContact?: CustomProjectInitialContact;
} = {}) {
  const sessionContext = useSession();
  const session = sessionContext?.data;
  const isVerifiedUser = Boolean(session?.user?.id && session?.user?.email);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = React.useState({
    name: initialContact?.name || "",
    email: initialContact?.email || "",
    whatsapp: initialContact?.whatsapp || "",
    projectTitle: "",
    category: "web-application",
    technologyPreferences: [] as string[],
    description: "",
    requiredFeatures: "",
    deadline: "",
    budget: "",
    additionalRequirements: "",
  });

  // Anti-spam fields (N1): honeypot, mount timestamp, and Turnstile token
  const [website, setWebsite] = React.useState("");
  const [formSubmittedAt] = React.useState<number>(() => Date.now());
  const [turnstileToken, setTurnstileToken] = React.useState<string>("");
  const turnstileRef = React.useRef<TurnstileWidgetHandle | null>(null);

  const [isLoading, setIsLoading] = React.useState(false);
  const [customTechInput, setCustomTechInput] = React.useState("");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  function resetTurnstile() {
    setTurnstileToken("");
    turnstileRef.current?.reset();
  }

  React.useEffect(() => {
    if (session?.user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || session.user?.name || "",
        email: prev.email || session.user?.email || "",
      }));

      fetch("/api/user/profile")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.user) {
            setFormData((prev) => ({
              ...prev,
              name: prev.name || data.user.name || session.user?.name || "",
              email:
                prev.email === "" || prev.email === session.user?.email
                  ? data.user.contactEmail || data.user.email || prev.email
                  : prev.email,
              whatsapp: prev.whatsapp || data.user.whatsapp || "",
            }));
          }
        })
        .catch(() => null);
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

  const handleAddCustomTech = () => {
    const raw = customTechInput.trim();
    if (!raw) return;
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;

    setFormData((prev) => {
      const next = [...prev.technologyPreferences];
      for (const part of parts) {
        if (next.length >= 10) break;
        const match = POPULAR_TECHNOLOGIES.find(
          (t) => t.toLowerCase() === part.toLowerCase()
        );
        const tag = match || part;
        if (!next.some((t) => t.toLowerCase() === tag.toLowerCase())) {
          next.push(tag);
        }
      }
      return { ...prev, technologyPreferences: next };
    });
    setCustomTechInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isVerifiedUser && !turnstileToken) {
      setErrorMessage("Please complete the security verification before submitting.");
      return;
    }

    // Basic client validation
    if (formData.description.trim().length < 50) {
      setErrorMessage("Description must be at least 50 characters long.");
      return;
    }

    if (formData.requiredFeatures.trim().length < 10) {
      setErrorMessage("Required features must be at least 10 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/custom-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          website,
          formSubmittedAt,
          turnstileToken: !isVerifiedUser ? turnstileToken : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        resetTurnstile();
        throw new Error(data.error || "Failed to submit custom project request.");
      }

      setSuccessMessage(
        typeof data?.message === "string"
          ? data.message
          : "Your custom project request has been saved for review."
      );
      setSuccess(true);
    } catch (err: unknown) {
      resetTurnstile();
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
          {successMessage || "Your custom project request has been saved for review."}
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

  const isSubmitDisabled = isLoading || (mounted && !isVerifiedUser && !turnstileToken);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-10 shadow-xs space-y-8"
      suppressHydrationWarning
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

      {/* Honeypot field: hidden from sighted users and assistive technologies */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] top-auto w-px h-px overflow-hidden opacity-0 pointer-events-none"
      >
        <label htmlFor="custom-request-website">Website</label>
        <input
          id="custom-request-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

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
            <Label className="text-[#102124]">Preferred Technologies (Select or type custom tags)</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <Input
                value={customTechInput}
                onChange={(e) => setCustomTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomTech();
                  }
                }}
                placeholder="Type custom tech tag (e.g. GraphQL, Go, Rust) and press Enter"
                className="text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomTech}
                disabled={!customTechInput.trim() || formData.technologyPreferences.length >= 10}
                className="shrink-0 font-semibold"
              >
                Add Tag
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from(
                new Set([...POPULAR_TECHNOLOGIES, ...formData.technologyPreferences])
              ).map((tech) => {
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
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              placeholder="e.g. 25000 (numbers only, optional)"
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

      {/* Turnstile widget shown only to visitors not signed in with a verified email (N1) */}
      {!isVerifiedUser && (
        <div className="pt-2">
          <TurnstileWidget
            ref={turnstileRef}
            onVerify={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken("")}
            onError={() => setTurnstileToken("")}
            theme="light"
          />
        </div>
      )}

      <div className="pt-4 border-t border-[#D9E2E4] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-xs text-[#526267]">
          Strict confidentiality. Your project idea is safe with our team.
        </p>
        <Button
          type="submit"
          size="lg"
          isLoading={isLoading}
          disabled={isSubmitDisabled}
          className="gap-2 shadow-xs cursor-pointer w-full sm:w-auto"
          suppressHydrationWarning
        >
          <Send className="w-4 h-4" />
          {isLoading ? "Submitting Request..." : "Submit Custom Project Request"}
        </Button>
      </div>
    </form>
  );
}
