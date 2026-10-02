// app/admin/projects/import/page.tsx
// Admin interface for importing projects from AI-generated JSON.
// Source of truth: docs/22-project-import.md & docs/23-project-import-template.md

"use client";

import * as React from "react";
import Link from "next/link";
import {
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  UserCheck,
  UserPlus,
  ListChecks,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const SAMPLE_IMPORT_JSON = JSON.stringify(
  {
    title: "AI Resume Analyzer",
    shortDescription:
      "An AI-powered web application that analyzes resumes for ATS compatibility, extracts skills, and generates improvement suggestions.",
    fullDescription:
      "AI Resume Analyzer is a full-stack web application that helps job seekers improve their resumes using artificial intelligence.\n\nThe platform allows users to upload their resume (PDF or DOCX), which is then analyzed against job descriptions or industry standards. The AI engine extracts key skills, identifies gaps, checks ATS compatibility, and provides actionable improvement suggestions.\n\nBuilt with Python Flask on the backend and a clean JavaScript frontend, the application connects to a PostgreSQL database for storing user sessions and analysis history.",
    category: "AI / Machine Learning",
    projectType: "Web Application",
    technologies: [
      "Python",
      "Flask",
      "PostgreSQL",
      "JavaScript",
      "OpenAI API",
      "Docker",
    ],
    features: [
      "Resume upload supporting PDF and DOCX formats",
      "ATS compatibility score calculation",
      "Skill extraction and keyword analysis",
      "Job description matching and gap analysis",
      "Improvement suggestions with priority ranking",
      "Analysis history saved per user account",
      "Downloadable analysis report (PDF)",
    ],
    specifications: {
      frontend: "HTML5, CSS3, Vanilla JavaScript",
      backend: "Python 3.11, Flask 3.0",
      database: "PostgreSQL 16",
      authentication: "Google OAuth 2.0",
      aiml: "OpenAI GPT-4o API",
      deployment: "Docker + Vercel / Railway",
    },
    whatsIncluded: [
      "Complete Python + JavaScript source code",
      "PostgreSQL database schema with seed data",
      "Docker Compose configuration",
      "Full API documentation",
      "Installation and deployment guide",
      "30 days of email support after delivery",
    ],
    faq: [
      {
        question: "Can this project be customized?",
        answer:
          "Yes. The project can be customized to your specific requirements. Contact the provider to discuss customization options.",
      },
      {
        question: "What hosting is required?",
        answer:
          "The backend requires a Python-capable host (Railway, Render, or VPS). The frontend can be deployed on Vercel. A Neon or Supabase PostgreSQL instance is recommended.",
      },
    ],
    priceMode: "CONTACT",
    price: null,
    demoUrl: "https://demo.example.com",
    provider: {
      name: "Sample Partner",
      email: "partner@example.com",
      whatsapp: "+919876543210",
    },
  },
  null,
  2
);

interface PreviewData {
  project: {
    title: string;
    slug: string;
    shortDescription: string;
    fullDescription: string;
    projectType: string | null;
    demoUrl: string | null;
    priceMode: string;
    price: number | null;
    whatsIncluded: string[];
    featuresCount: number;
    specsCount: number;
    faqsCount: number;
    features: Array<{ feature: string; sortOrder: number }>;
    specifications: Array<{ key: string; value: string; sortOrder: number }>;
    faqs: Array<{ question: string; answer: string; sortOrder: number }>;
  };
  category: {
    name: string;
    slug: string;
    exists: boolean;
  };
  provider: {
    name: string;
    email: string;
    whatsapp: string | null;
    exists: boolean;
    consentConfirmed: boolean;
  };
  technologies: {
    total: number;
    existing: string[];
    new: string[];
  };
}

export default function ProjectImportPage() {
  const toast = useToast();
  const [jsonText, setJsonText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [errorBanner, setErrorBanner] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [previewData, setPreviewData] = React.useState<PreviewData | null>(null);
  const [importedProject, setImportedProject] = React.useState<{
    id: string;
    slug: string;
    title: string;
  } | null>(null);

  // Validate JSON string syntax then call preview API
  async function handleValidate() {
    setErrorBanner(null);
    setFieldErrors({});

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonText.trim());
    } catch {
      setErrorBanner(
        "The JSON you pasted is not valid. Please check for syntax errors, missing brackets, or quotes."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/projects/import?action=preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: parsedJson, previewOnly: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          setFieldErrors(data.details);
          setErrorBanner("Validation failed. Please correct the highlighted errors.");
          toast.error("Validation failed. Please correct the highlighted errors.");
        } else {
          setErrorBanner(data.error || "Failed to validate import payload");
          toast.error(data.error || "Failed to validate import payload");
        }
        return;
      }

      setPreviewData(data);
      toast.success("JSON validated successfully. Review the preview below.");
    } catch (err) {
      console.error("Preview error:", err);
      setErrorBanner("An unexpected error occurred during validation.");
    } finally {
      setLoading(false);
    }
  }

  // Execute actual import as DRAFT
  async function handleImport() {
    if (!jsonText) return;
    setImporting(true);
    setErrorBanner(null);

    try {
      const parsedJson = JSON.parse(jsonText.trim());
      const res = await fetch("/api/admin/projects/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: parsedJson }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorBanner(data.error || "Failed to import project.");
        toast.error(data.error || "Failed to import project.");
        setImporting(false);
        return;
      }

      setImportedProject(data.data);
      toast.success(`Project "${data.data?.title || "Draft"}" imported successfully.`);
    } catch (err) {
      console.error("Import error:", err);
      setErrorBanner("Network error during import. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  // ── Success State ──────────────────────────────────────────────────────────
  if (importedProject) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xs space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Project Imported Successfully!</h1>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              <strong>{importedProject.title}</strong> has been saved as a{" "}
              <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                DRAFT
              </span>
              . It is not visible to the public until you publish it.
            </p>
          </div>

          {/* Post-import checklist from docs/22-project-import.md */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left max-w-md mx-auto space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <ListChecks className="w-4 h-4 text-[#155761]" />
              Recommended Next Steps
            </h3>
            <ul className="text-xs text-gray-600 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center text-[10px] text-gray-400">
                  1
                </span>
                Upload screenshots and project banner
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center text-[10px] text-gray-400">
                  2
                </span>
                Verify provider contact settings & confirm consent
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center text-[10px] text-gray-400">
                  3
                </span>
                Review features and specifications
              </li>
              <li className="flex items-center gap-2">
                <span className="w-4 h-4 border border-gray-300 rounded flex items-center justify-center text-[10px] text-gray-400">
                  4
                </span>
                Set status to PUBLISHED when ready
              </li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Link href={`/admin/projects/${importedProject.id}/edit`} className={buttonVariants({ variant: "primary", size: "lg", className: "gap-2" })}>
                Open in Project Editor
                <ArrowRight className="w-4 h-4" />
              </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setImportedProject(null);
                setPreviewData(null);
                setJsonText("");
              }}
            >
              Import Another Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
            <Link href="/admin/projects" className="hover:text-[#155761] transition-colors">
              Projects
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Import JSON</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Import Project from JSON</h1>
          <p className="text-xs text-gray-500 mt-1">
            Paste structured JSON generated by an AI assistant or tool. Imported projects are created as DRAFTS.
          </p>
        </div>

        <Link href="/admin/projects" className={buttonVariants({ variant: "ghost", size: "sm", className: "gap-1.5" })}>
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Link>
      </div>

      {errorBanner && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          {Object.keys(fieldErrors).length > 0 && (
            <ul className="list-disc list-inside mt-2 pl-2 space-y-0.5 text-red-600">
              {Object.entries(fieldErrors).map(([field, errs]) => (
                <li key={field}>
                  <strong className="capitalize">{field}:</strong> {errs.join(", ")}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Step 1: JSON Editor */}
      {!previewData ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-[#155761]" />
              <h2 className="text-base font-bold text-gray-900">Project JSON Input</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setJsonText(SAMPLE_IMPORT_JSON)}
                className="gap-1.5 text-xs text-[#155761] border-[#D9E2E4] hover:bg-[#F3F7F7]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load Sample JSON
              </Button>
              {jsonText && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setJsonText("")}
                  className="text-xs text-gray-500"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={16}
              placeholder='Paste project JSON here... e.g. { "title": "My App", "category": "AI / Machine Learning", ... }'
              className="w-full font-mono text-xs p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#155761] focus:border-transparent transition-all leading-relaxed"
            />
            <p className="text-[11px] text-gray-400">
              Follows the schema documented in <code className="bg-gray-100 px-1 py-0.5 rounded">docs/23-project-import-template.md</code>.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={handleValidate}
              isLoading={loading}
              disabled={loading || !jsonText.trim()}
              className="gap-2"
            >
              Validate & Preview
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : (
        /* Step 2: Import Preview Card */
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <span className="text-xs font-bold text-[#155761] uppercase tracking-wider">Step 2 of 2</span>
              <h2 className="text-xl font-bold text-gray-900 mt-0.5">Project Import Preview</h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewData(null)}
              className="gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Edit JSON
            </Button>
          </div>

          {/* Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <div>
                <span className="text-gray-400 font-medium">Title</span>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{previewData.project.title}</p>
              </div>

              <div>
                <span className="text-gray-400 font-medium">Category</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-semibold text-gray-900">{previewData.category.name}</span>
                  {previewData.category.exists ? (
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-200">
                      Existing ✓
                    </span>
                  ) : (
                    <span className="bg-[#F3F7F7] text-[#155761] text-[10px] font-semibold px-2 py-0.5 rounded border border-[#D9E2E4]">
                      New (will be created)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-gray-400 font-medium">Pricing</span>
                <p className="font-medium text-gray-900 mt-0.5">
                  {previewData.project.priceMode}
                  {previewData.project.price != null ? ` — ₹${previewData.project.price.toLocaleString("en-IN")}` : ""}
                </p>
              </div>

              <div>
                <span className="text-gray-400 font-medium">Project Type</span>
                <p className="font-medium text-gray-900 mt-0.5">{previewData.project.projectType || "Not specified"}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-gray-400 font-medium">Provider</span>
                <div className="mt-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{previewData.provider.name}</span>
                    {previewData.provider.exists ? (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Existing Provider ✓
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                        <UserPlus className="w-3 h-3" /> New Provider will be created
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-[11px]">{previewData.provider.email}</p>
                </div>
              </div>

              <div>
                <span className="text-gray-400 font-medium">Technologies</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {previewData.technologies.existing.map((tech) => (
                    <span
                      key={tech}
                      className="bg-gray-100 text-gray-700 text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1"
                    >
                      {tech}
                      <span className="text-[9px] text-emerald-600 font-bold">✓</span>
                    </span>
                  ))}
                  {previewData.technologies.new.map((tech) => (
                    <span
                      key={tech}
                      className="bg-[#F3F7F7] text-[#155761] border border-[#D9E2E4] text-[11px] font-medium px-2 py-0.5 rounded flex items-center gap-1"
                    >
                      {tech}
                      <span className="text-[9px] text-[#2F7D78] font-semibold">+new</span>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-gray-400 font-medium">Content Breakdown</span>
                <div className="flex gap-4 mt-1 font-medium text-gray-700">
                  <span>{previewData.project.featuresCount} Features</span>
                  <span>•</span>
                  <span>{previewData.project.specsCount} Specifications</span>
                  <span>•</span>
                  <span>{previewData.project.faqsCount} FAQs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">This project will be imported as DRAFT.</p>
              <p className="mt-0.5 text-amber-700">
                It will not be visible on the public catalog. You can upload screenshots, verify provider consent, and review all details before publishing.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setPreviewData(null)}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleImport}
              isLoading={importing}
              disabled={importing}
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {importing ? "Importing Project..." : "Import as Draft"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
