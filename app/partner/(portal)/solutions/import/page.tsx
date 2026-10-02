// app/partner/(portal)/solutions/import/page.tsx
// Solution Partner JSON Import page.

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileCode,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

const SAMPLE_PARTNER_JSON = JSON.stringify(
  {
    title: "AI Resume & Portfolio Analyzer",
    shortDescription:
      "An automated ATS compliance analyzer and developer portfolio scanner built with Next.js, FastAPI, and OpenAI.",
    fullDescription:
      "AI Resume & Portfolio Analyzer is a full-stack turnkey software application that helps engineering candidates optimize their applications for automated ATS recruiters.\n\nThe system evaluates resume formatting, extracts core skills, identifies technical qualification gaps, and calculates an ATS match score with actionable suggestions.\n\nIncludes candidate authentication, PDF parsing, exportable audit reports, and a responsive Tailwind CSS dashboard.",
    category: "AI / Machine Learning",
    projectType: "Full-Stack Web Application",
    technologies: [
      "Next.js 15",
      "TypeScript",
      "Python",
      "FastAPI",
      "PostgreSQL",
      "Tailwind CSS",
      "Docker",
    ],
    features: [
      "PDF and DOCX document ingestion and extraction",
      "ATS compatibility scoring and keyword density metrics",
      "Automated skill gap and missing keyword recommendations",
      "Interactive candidate dashboard with saved report histories",
      "Exportable PDF candidate evaluation summaries",
    ],
    specifications: {
      frontend: "Next.js 15 App Router, React 19, Tailwind CSS",
      backend: "FastAPI, Python 3.11, Pydantic v2",
      database: "PostgreSQL 16 with Prisma ORM",
      authentication: "NextAuth / OAuth 2.0",
      deployment: "Docker Compose, Vercel / Railway ready",
    },
    whatsIncluded: [
      "Full frontend & backend source code repository",
      "Database schema and sample seed data script",
      "Complete REST API documentation (OpenAPI / Swagger)",
      "Docker Compose environment setup guide",
      "60 days of technical email support post-delivery",
    ],
    faq: [
      {
        question: "Can I customize the branding and ATS score criteria?",
        answer:
          "Yes. All scoring weights, branding assets, and prompt chains are fully customizable in the environment configuration.",
      },
      {
        question: "Does this require an external OpenAI API key?",
        answer:
          "Yes. You can supply your own OpenAI API key or swap in any local LLM via Ollama.",
      },
    ],
    priceMode: "FIXED",
    price: 4999,
    demoUrl: "https://demo.example.com",
    status: "PUBLISHED",
    featured: false,
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
    status: "DRAFT" | "PUBLISHED";
    featured: boolean;
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
  partner: {
    name: string;
    email: string;
  };
  technologies: {
    total: number;
    existing: string[];
    new: string[];
  };
}

export default function PartnerImportPage() {
  const router = useRouter();
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
  const [copiedTemplate, setCopiedTemplate] = React.useState(false);

  // Validate JSON string syntax then call preview API
  async function handleValidate() {
    setErrorBanner(null);
    setFieldErrors({});

    const trimmed = jsonText.trim();
    if (!trimmed) {
      setErrorBanner("Please paste your project JSON first.");
      return;
    }

    let parsedJson: any;
    try {
      parsedJson = JSON.parse(trimmed);
    } catch {
      setErrorBanner(
        "The JSON you pasted is not valid. Please check for syntax errors, missing commas, or unclosed quotes."
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/partner/solutions/import?action=preview", {
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
      setErrorBanner("An unexpected error occurred during preview validation.");
    } finally {
      setLoading(false);
    }
  }

  // Execute actual import
  async function handleImport() {
    if (!jsonText) return;
    setImporting(true);
    setErrorBanner(null);

    try {
      const parsedJson = JSON.parse(jsonText.trim());
      const res = await fetch("/api/partner/solutions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: parsedJson }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorBanner(data.error || "Failed to import solution.");
        toast.error(data.error || "Failed to import solution.");
        return;
      }

      setImportedProject(data.project);
      toast.success(`Solution "${data.project?.title || ""}" imported successfully!`);
      router.refresh();
    } catch (err) {
      console.error("Import error:", err);
      setErrorBanner("An unexpected error occurred during import.");
    } finally {
      setImporting(false);
    }
  }

  const handleCopyTemplate = () => {
    setJsonText(SAMPLE_PARTNER_JSON);
    setCopiedTemplate(true);
    setErrorBanner(null);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D9E2E4]">
        <div className="flex items-center gap-3">
          <Link
            href="/partner/solutions"
            className="p-2 rounded-xl bg-white border border-[#D9E2E4] hover:bg-[#F3F7F7] text-[#526267] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#102124] flex items-center gap-2">
              <FileCode className="w-5 h-5 text-[#155761]" />
              Import Solution via JSON
            </h1>
            <p className="text-xs text-[#526267]">
              Paste AI-generated or exported software JSON to instantly list your application with features, specs, and deliverables.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyTemplate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#155761]/30 bg-[#F3F7F7] hover:bg-[#E5EEEE] text-xs font-semibold text-[#155761] transition-colors cursor-pointer self-start sm:self-auto"
        >
          {copiedTemplate ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Loaded Template!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Load Sample Template</span>
            </>
          )}
        </button>
      </div>

      {/* ── Success Banner ─────────────────────────────────────────────── */}
      {importedProject && (
        <div className="p-6 rounded-2xl bg-[#DDF4EC] border border-[#2F7D78]/30 space-y-4 shadow-sm animate-in fade-in duration-300">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#2F7D78] shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-bold text-[#155761]">
                Solution Imported Successfully!
              </h2>
              <p className="text-xs text-[#10474F] mt-1">
                <strong>{importedProject.title}</strong> has been added to your partner account. You can now add screenshots or view it in your solutions list.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Link
              href={`/partner/solutions/${importedProject.id}/edit`}
              className={buttonVariants({
                variant: "primary",
                size: "sm",
                className: "gap-1.5 font-bold shadow-xs",
              })}
            >
              <span>Upload Screenshots &amp; Edit</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/partner/solutions"
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "bg-white",
              })}
            >
              Back to My Solutions
            </Link>
            <button
              type="button"
              onClick={() => {
                setImportedProject(null);
                setPreviewData(null);
                setJsonText("");
              }}
              className="text-xs text-[#155761] hover:underline font-semibold ml-2 cursor-pointer"
            >
              Import Another
            </button>
          </div>
        </div>
      )}

      {/* ── Error Banner ───────────────────────────────────────────────── */}
      {errorBanner && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{errorBanner}</p>
            {Object.keys(fieldErrors).length > 0 && (
              <ul className="list-disc list-inside space-y-0.5 text-rose-700">
                {Object.entries(fieldErrors).map(([field, errs]) => (
                  <li key={field}>
                    <strong>{field}:</strong> {errs.join(", ")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* ── JSON Input Card ────────────────────────────────────────────── */}
      {!importedProject && (
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#102124] uppercase tracking-wider">
              Paste Solution JSON
            </label>
            <span className="text-[11px] text-[#526267]">
              {jsonText.split("\n").length} lines
            </span>
          </div>

          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setPreviewData(null);
            }}
            placeholder='{\n  "title": "My Software Solution",\n  "shortDescription": "...",\n  "category": "Web Applications",\n  "priceMode": "FIXED",\n  "price": 2999\n}'
            rows={14}
            className="w-full font-mono text-xs bg-[#F8FAFA] border border-[#D9E2E4] rounded-xl p-4 text-[#102124] focus:outline-none focus:border-[#155761] focus:ring-1 focus:ring-[#155761] transition"
            spellCheck={false}
          />

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => {
                setJsonText("");
                setPreviewData(null);
                setErrorBanner(null);
              }}
              disabled={!jsonText}
              className="text-xs text-[#526267] hover:text-rose-600 transition disabled:opacity-40 cursor-pointer"
            >
              Clear
            </button>

            <Button
              type="button"
              onClick={handleValidate}
              isLoading={loading}
              disabled={loading || !jsonText.trim()}
              className="rounded-xl bg-[#155761] hover:bg-[#10474F] text-white text-xs px-5 h-9 font-semibold gap-2 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Validate &amp; Preview</span>
            </Button>
          </div>
        </div>
      )}

      {/* ── Preview Card ───────────────────────────────────────────────── */}
      {previewData && !importedProject && (
        <div className="bg-white rounded-2xl border border-[#BEDEE1] p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#F3F7F7] pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#155761] bg-[#DDF4EC] px-2.5 py-0.5 rounded-full">
                Validation Passed
              </span>
              <h2 className="text-lg font-bold text-[#102124] mt-1">
                Preview: {previewData.project.title}
              </h2>
            </div>
            <span className="text-xs font-mono text-[#526267]">
              /{previewData.project.slug}
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-[#F8FAFA] rounded-xl border border-[#D9E2E4]">
              <span className="text-[#526267] block">Category</span>
              <span className="font-bold text-[#102124] mt-0.5 block truncate">
                {previewData.category.name}
              </span>
              <span className="text-[10px] text-[#2F7D78]">
                {previewData.category.exists ? "✓ Matches existing" : "+ Will be created"}
              </span>
            </div>

            <div className="p-3 bg-[#F8FAFA] rounded-xl border border-[#D9E2E4]">
              <span className="text-[#526267] block">Pricing</span>
              <span className="font-bold text-[#102124] mt-0.5 block">
                {previewData.project.priceMode === "CONTACT"
                  ? "Contact"
                  : `₹${previewData.project.price?.toLocaleString() || 0}`}
              </span>
              <span className="text-[10px] text-[#526267]">
                Mode: {previewData.project.priceMode}
              </span>
            </div>

            <div className="p-3 bg-[#F8FAFA] rounded-xl border border-[#D9E2E4]">
              <span className="text-[#526267] block">Features &amp; Specs</span>
              <span className="font-bold text-[#102124] mt-0.5 block">
                {previewData.project.featuresCount} feats · {previewData.project.specsCount} specs
              </span>
              <span className="text-[10px] text-[#526267]">
                {previewData.project.faqsCount} FAQs included
              </span>
            </div>

            <div className="p-3 bg-[#F8FAFA] rounded-xl border border-[#D9E2E4]">
              <span className="text-[#526267] block">Owner Partner</span>
              <span className="font-bold text-[#102124] mt-0.5 block truncate">
                {previewData.partner.name}
              </span>
              <span className="text-[10px] text-[#2F7D78]">✓ Verified session</span>
            </div>
          </div>

          {/* Tech Stack Preview */}
          {previewData.technologies.total > 0 && (
            <div className="space-y-1.5 text-xs">
              <span className="font-semibold text-[#102124]">
                Detected Tech Stack ({previewData.technologies.total})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {previewData.technologies.existing.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded-md bg-[#155761] text-white font-medium text-[11px]"
                  >
                    {tech}
                  </span>
                ))}
                {previewData.technologies.new.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded-md bg-[#DDF4EC] text-[#155761] border border-[#2F7D78]/30 font-medium text-[11px]"
                  >
                    + {tech} (new)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description Preview */}
          <div className="space-y-1 text-xs">
            <span className="font-semibold text-[#102124]">Short Teaser Description</span>
            <p className="text-[#526267] leading-relaxed p-3 bg-[#F8FAFA] rounded-xl border border-[#D9E2E4]">
              {previewData.project.shortDescription}
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-[#F3F7F7]">
            <p className="text-xs text-[#526267]">
              Ready to import? You can add screenshots and edit all details after import.
            </p>

            <Button
              type="button"
              onClick={handleImport}
              isLoading={importing}
              disabled={importing}
              className="rounded-xl bg-[#2F7D78] hover:bg-[#256561] text-white text-xs px-6 h-10 font-bold gap-2 shadow-xs cursor-pointer"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing Solution...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Import to My Solutions</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
