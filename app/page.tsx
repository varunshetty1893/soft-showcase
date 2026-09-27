// app/page.tsx
// Public Homepage for Soft Showcase in Teal Mint Discovery design language.
// Source of truth: docs/08-page-specifications.md & docs/09-ui-ux-guidelines.md

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Globe,
  Smartphone,
  ShoppingCart,
  Layout,
  Settings,
  Server,
  Brain,
  Package,
  ShieldCheck,
  MessageCircle,
  Zap,
  Sparkles,
  Rocket,
  Search,
  ExternalLink,
  Layers,
  Terminal,
  FileCode2,
  Ban,
  Handshake,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { DEFAULT_CATEGORIES } from "@/config/categories";
import type { Metadata } from "next";
import { APP_NAME, APP_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: "Soft Showcase — Discover & Buy Software Projects",
  description:
    "Browse a curated catalog of software projects. Contact providers directly via WhatsApp or Email. Find AI tools, web apps, e-commerce solutions, and more.",
  alternates: {
    canonical: APP_URL,
  },
  openGraph: {
    title: "Soft Showcase — Discover & Buy Software Projects",
    description:
      "Browse a curated catalog of software projects. Contact providers directly via WhatsApp or Email. Find AI tools, web apps, e-commerce solutions, and more.",
    url: APP_URL,
    siteName: APP_NAME,
    type: "website",
  },
};

const categoryIconMap: Record<string, React.ReactNode> = {
  Globe: <Globe className="w-6 h-6" />,
  Smartphone: <Smartphone className="w-6 h-6" />,
  ShoppingCart: <ShoppingCart className="w-6 h-6" />,
  Layout: <Layout className="w-6 h-6" />,
  Settings: <Settings className="w-6 h-6" />,
  Server: <Server className="w-6 h-6" />,
  Brain: <Brain className="w-6 h-6" />,
  Package: <Package className="w-6 h-6" />,
};

const categoryTagsMap: Record<string, string[]> = {
  "web-application": ["Full-Stack", "SaaS", "Dashboard"],
  "mobile-app": ["iOS", "Android", "React Native"],
  "e-commerce": ["Storefront", "Cart", "Stripe"],
  "landing-page": ["High-Converting", "Tailwind", "SEO"],
  "admin-panel": ["Analytics", "CRUD", "NextAuth"],
  "api-backend": ["REST", "Microservices", "PostgreSQL"],
  "ai-ml": ["LLM Ops", "Agents", "OpenAI"],
  other: ["Developer Tools", "Utilities", "Libraries"],
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#eefcfe] text-[#111d1f] font-sans selection:bg-[#8cf7ce] selection:text-[#002116]">
      <Navbar />

      <main className="flex-1 w-full">
        {/* ── 1. Hero Section ────────────────────────────────────────────── */}
        <div className="relative w-full overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24">
          {/* Ambient Radial Glows */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[520px] bg-gradient-to-b from-[#8cf7ce]/25 via-[#e3f0f3]/35 to-transparent blur-3xl pointer-events-none rounded-full" />
          <div className="absolute top-80 -left-48 w-[420px] h-[420px] bg-[#8cf7ce]/20 blur-3xl pointer-events-none rounded-full" />
          <div className="absolute top-[600px] -right-48 w-[450px] h-[450px] bg-[#184e58]/10 blur-3xl pointer-events-none rounded-full" />

          <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            {/* Top Badge / Pill */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white shadow-sm border border-[#d8e5e7]/80 mb-8 transition-transform hover:scale-105 duration-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006c50] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#006c50]" />
              </span>
              <span className="text-xs font-bold text-[#00373f] tracking-wide uppercase">
                Curated Software Discovery 2.0
              </span>
              <span className="w-1 h-1 rounded-full bg-[#c0c8ca]" />
              <span className="text-xs font-bold text-[#006c50]">
                Verified Direct Routing
              </span>
            </div>

            {/* Hero Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[62px] font-bold tracking-tight text-[#111d1f] max-w-4xl mx-auto leading-[1.12] mb-6">
              Discover exceptional software crafted with{" "}
              <span className="bg-gradient-to-r from-[#00373f] via-[#184e58] to-[#006c50] bg-clip-text text-transparent">
                precision and purpose.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl text-[#40484a] max-w-2xl mx-auto mb-10 leading-relaxed">
              Explore handpicked software solutions, developer toolkits, and production-ready applications built by verified creators worldwide. Connect directly via WhatsApp or email with zero middleman fees.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
              <Link href="/projects">
                <button className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#00373f] text-white font-semibold text-sm shadow-[0_4px_16px_rgba(0,55,63,0.18)] hover:bg-[#184e58] hover:shadow-[0_8px_24px_rgba(0,55,63,0.25)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
                  <span>Explore Showcase</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/custom-project">
                <button className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-[#00373f] font-semibold text-sm shadow-sm border border-[#d8e5e7] hover:bg-[#e9f6f8] hover:border-[#8cf7ce] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
                  <Rocket className="w-4 h-4 text-[#006c50]" />
                  <span>Request Custom Build</span>
                </button>
              </Link>
            </div>

            {/* Live Metric Chips */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-[#40484a] mb-14">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-[#d8e5e7]/80 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-[#006c50]" />
                <span>
                  <strong className="text-[#111d1f]">Verified</strong> Independent Providers
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-[#d8e5e7]/80 shadow-xs">
                <MessageCircle className="w-4 h-4 text-[#006c50]" />
                <span>
                  <strong className="text-[#111d1f]">Direct</strong> WhatsApp &amp; Email Routing
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-[#d8e5e7]/80 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-[#006c50]" />
                <span>
                  <strong className="text-[#111d1f]">100%</strong> Zero Middleman Fees
                </span>
              </div>
            </div>

            {/* Hero Visual Mockup Fragment */}
            <div className="w-full max-w-5xl relative">
              {/* Floating Accent Badges */}
              <div className="absolute -top-5 -left-2 sm:left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white shadow-lg border border-[#d8e5e7] backdrop-blur-md">
                <span className="w-2.5 h-2.5 rounded-full bg-[#006c50] animate-pulse" />
                <span className="text-xs font-bold text-[#00373f]">
                  Live Verified Catalog
                </span>
              </div>
              <div className="absolute -bottom-5 -right-2 sm:right-6 z-20 hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-lg border border-[#d8e5e7]">
                <CheckCircle2 className="w-4 h-4 text-[#006c50]" />
                <span className="text-xs font-bold text-[#111d1f]">
                  100% Manual Editorial Verification
                </span>
              </div>

              {/* Browser Mockup Window */}
              <div className="w-full rounded-2xl bg-white border border-[#d8e5e7] shadow-2xl overflow-hidden text-left">
                {/* Header Window Chrome */}
                <div className="h-11 bg-[#e9f6f8] border-b border-[#d8e5e7] px-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ef4444]/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-[#f59e0b]/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-[#10b981]/80 inline-block" />
                  </div>
                  <div className="bg-white px-6 py-1 rounded-md text-[11px] font-mono text-[#70787b] border border-[#d8e5e7] flex items-center gap-2">
                    <Search className="w-3 h-3 text-[#70787b]" />
                    <span>softshowcase.com/projects</span>
                  </div>
                  <div className="w-12" />
                </div>

                {/* Mockup Inside Sample Cards Grid */}
                <div className="p-6 bg-gradient-to-b from-[#eefcfe]/30 to-white grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Sample Preview Card 1 */}
                  <div className="rounded-xl p-5 bg-white border border-[#d8e5e7] shadow-sm hover:border-[#8cf7ce] transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#8cf7ce]/25 text-[#006c50] text-[11px] font-bold">
                        AI / ML
                      </span>
                      <span className="text-xs font-bold text-[#00373f]">$499</span>
                    </div>
                    <h4 className="font-bold text-[#00373f] text-sm mb-1">
                      Autonomous Research Agent
                    </h4>
                    <p className="text-xs text-[#40484a] line-clamp-2 mb-3">
                      Full-stack multi-model AI synthesis engine with vector store and streaming chat UI.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#e9f6f8]">
                      <span className="px-2 py-0.5 rounded bg-[#e9f6f8] text-[10px] font-mono text-[#184e58]">
                        Next.js
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#e9f6f8] text-[10px] font-mono text-[#184e58]">
                        OpenAI
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#e9f6f8] text-[10px] font-mono text-[#184e58]">
                        Prisma
                      </span>
                    </div>
                  </div>

                  {/* Sample Preview Card 2 */}
                  <div className="rounded-xl p-5 bg-white border border-[#d8e5e7] shadow-sm hover:border-[#8cf7ce] transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#e9f6f8] text-[#00373f] text-[11px] font-bold">
                        SaaS Platform
                      </span>
                      <span className="text-xs font-bold text-[#00373f]">$799</span>
                    </div>
                    <h4 className="font-bold text-[#00373f] text-sm mb-1">
                      Fintech Analytics Dashboard
                    </h4>
                    <p className="text-xs text-[#40484a] line-clamp-2 mb-3">
                      Multi-tenant SaaS with real-time transactional reporting, Stripe billing, and team permissions.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#e9f6f8]">
                      <span className="px-2 py-0.5 rounded bg-[#e9f6f8] text-[10px] font-mono text-[#184e58]">
                        TypeScript
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#e9f6f8] text-[10px] font-mono text-[#184e58]">
                        PostgreSQL
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#e9f6f8] text-[10px] font-mono text-[#184e58]">
                        Tailwind
                      </span>
                    </div>
                  </div>

                  {/* Sample Preview Card 3 */}
                  <div className="rounded-xl p-5 bg-white border border-[#d8e5e7] shadow-sm hover:border-[#8cf7ce] transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#8cf7ce]/25 text-[#006c50] text-[11px] font-bold">
                        E-Commerce
                      </span>
                      <span className="text-xs font-bold text-[#00373f]">$349</span>
                    </div>
                    <h4 className="font-bold text-[#00373f] text-sm mb-1">
                      Headless Commerce Storefront
                    </h4>
                    <p className="text-xs text-[#40484a] line-clamp-2 mb-3">
                      Sub-second mobile commerce engine with localized currency checkout and CMS sync.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#e9f6f8]">
                      <span className="px-2 py-0.5 rounded bg-[#e9f6f8] text-[10px] font-mono text-[#184e58]">
                        React
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#e9f6f8] text-[10px] font-mono text-[#184e58]">
                        Next.js
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#e9f6f8] text-[10px] font-mono text-[#184e58]">
                        Stripe
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* ── 2. Curated Categories Section ──────────────────────────────── */}
        <section className="w-full bg-[#e9f6f8] py-20 px-4 sm:px-6 lg:px-8 border-y border-[#d8e5e7]/80">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ddebed] text-[#00373f] text-xs font-bold mb-3">
                  <Layers className="w-3.5 h-3.5 text-[#006c50]" />
                  <span>Curated Taxonomy</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#00373f]">
                  Explore by Ecosystem &amp; Discipline
                </h2>
                <p className="text-sm sm:text-base text-[#40484a] mt-2 max-w-xl leading-relaxed">
                  Structured directories vetted by engineers. Discover solutions segmented by operational utility and architectural integrity.
                </p>
              </div>

              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#006c50] hover:text-[#00373f] transition-colors self-start md:self-auto group"
              >
                <span>View All Categories</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {DEFAULT_CATEGORIES.map((cat) => {
                const tags = categoryTagsMap[cat.slug] || ["Software", "Custom", "Verified"];
                return (
                  <Link
                    key={cat.slug}
                    href={`/projects?category=${cat.slug}`}
                    className="group p-6 rounded-2xl bg-white border border-[#d8e5e7] shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-[#8cf7ce] transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#e9f6f8] flex items-center justify-center text-[#00373f] group-hover:bg-[#00373f] group-hover:text-white transition-colors shadow-xs">
                          {categoryIconMap[cat.iconName] || <Code2 className="w-6 h-6" />}
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#eefcfe] text-[#00373f] text-[11px] font-bold border border-[#d8e5e7]/80">
                          Active
                        </span>
                      </div>
                      <h3 className="font-bold text-[#00373f] text-base group-hover:text-[#006c50] transition-colors mb-1.5">
                        {cat.name}
                      </h3>
                      <p className="text-xs text-[#40484a] line-clamp-2 leading-relaxed mb-4">
                        {cat.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#e9f6f8]">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded bg-[#e9f6f8] text-[#70787b] text-[11px] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 3. How Soft Showcase Works (Methodology) ───────────────────── */}
        <section className="w-full bg-[#eefcfe] py-20 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold text-[#006c50] uppercase tracking-wider">
                Methodology
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#00373f] mt-1">
                How Soft Showcase Works
              </h2>
              <p className="text-sm sm:text-base text-[#40484a] mt-2 leading-relaxed">
                From technical inspection to production adoption, we engineer discovery to be frictionless and reliable.
              </p>
            </div>

            {/* 3 Steps Connected Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="rounded-2xl bg-white p-8 border border-[#d8e5e7] shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all duration-200">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="w-10 h-10 rounded-xl bg-[#e9f6f8] flex items-center justify-center text-sm font-bold text-[#00373f]">
                      01
                    </span>
                    <Search className="w-6 h-6 text-[#006c50]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#00373f] mb-3">
                    Discover &amp; Evaluate
                  </h3>
                  <p className="text-sm text-[#40484a] leading-relaxed mb-6">
                    Browse verified software with unfiltered metrics, technical architecture breakdowns, and direct demo access.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#e9f6f8] flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-[#006c50] shrink-0" />
                  <span className="text-xs text-[#111d1f] font-semibold">
                    Strict sanity check on code &amp; uptime
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="rounded-2xl bg-white p-8 border border-[#d8e5e7] shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all duration-200">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="w-10 h-10 rounded-xl bg-[#e9f6f8] flex items-center justify-center text-sm font-bold text-[#006c50]">
                      02
                    </span>
                    <MessageCircle className="w-6 h-6 text-[#00373f]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#00373f] mb-3">
                    Connect with Makers
                  </h3>
                  <p className="text-sm text-[#40484a] leading-relaxed mb-6">
                    Direct communication channels with verified builders and lead engineers without middleman friction or fee markups.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#e9f6f8] flex items-center gap-3">
                  <Zap className="w-4 h-4 text-[#006c50] shrink-0" />
                  <span className="text-xs text-[#111d1f] font-semibold">
                    Encrypted WhatsApp &amp; direct email
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="rounded-2xl bg-white p-8 border border-[#d8e5e7] shadow-sm flex flex-col justify-between group hover:shadow-lg transition-all duration-200">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="w-10 h-10 rounded-xl bg-[#e9f6f8] flex items-center justify-center text-sm font-bold text-[#00373f]">
                      03
                    </span>
                    <Rocket className="w-6 h-6 text-[#006c50]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#00373f] mb-3">
                    Ship &amp; Integrate
                  </h3>
                  <p className="text-sm text-[#40484a] leading-relaxed mb-6">
                    Acquire the codebase directly, hire the provider for customized adaptations, or kickstart your own production rollout.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#e9f6f8] flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-[#006c50] shrink-0" />
                  <span className="text-xs text-[#111d1f] font-semibold">
                    1-click repository handover or custom build
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. Built for Clarity and Direct Connection ──────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Narrative */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <span className="text-xs font-bold text-[#006c50] uppercase tracking-wider">
                Uncompromising Principles
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#00373f] leading-tight">
                Built for clarity and direct connection.
              </h2>
              <p className="text-base sm:text-lg text-[#40484a] leading-relaxed">
                Traditional discovery marketplaces take massive commissions and lock down conversations. Soft Showcase is calibrated exclusively for engineering fidelity and transparent peer validation.
              </p>

              {/* Brand Accent Fragment */}
              <div className="p-4 rounded-xl bg-white border border-[#d8e5e7] flex items-center gap-4 mt-2 shadow-xs">
                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#00373f] text-[#8cf7ce] font-extrabold text-sm border border-[#184e58] shrink-0">
                  SS
                </span>
                <div>
                  <span className="text-xs font-bold text-[#00373f] block">
                    The Independent Standard
                  </span>
                  <span className="text-xs text-[#70787b]">
                    Connecting verified software creators and buyers
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: 2x2 Feature Bento Cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl bg-white border border-[#d8e5e7] shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-[#e9f6f8] flex items-center justify-center text-[#00373f] mb-4">
                  <Ban className="w-5 h-5 text-[#00373f]" />
                </div>
                <h3 className="font-bold text-[#00373f] text-base mb-2">
                  Zero Sponsored Noise
                </h3>
                <p className="text-xs sm:text-sm text-[#40484a] leading-relaxed">
                  Strict editorial standards where no provider can pay for algorithm promotion or featured slots.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl bg-white border border-[#d8e5e7] shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-[#e9f6f8] flex items-center justify-center text-[#006c50] mb-4">
                  <Handshake className="w-5 h-5 text-[#006c50]" />
                </div>
                <h3 className="font-bold text-[#00373f] text-base mb-2">
                  Direct Maker Channels
                </h3>
                <p className="text-xs sm:text-sm text-[#40484a] leading-relaxed">
                  Reach creators directly via encrypted WhatsApp and authenticated email without commission fees.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl bg-white border border-[#d8e5e7] shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-[#e9f6f8] flex items-center justify-center text-[#006c50] mb-4">
                  <FileCode2 className="w-5 h-5 text-[#006c50]" />
                </div>
                <h3 className="font-bold text-[#00373f] text-base mb-2">
                  Technical Deep-Dives
                </h3>
                <p className="text-xs sm:text-sm text-[#40484a] leading-relaxed">
                  Inspect stack details, database schemas, changelogs, and live interactive demos at a single glance.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl bg-white border border-[#d8e5e7] shadow-sm hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-[#e9f6f8] flex items-center justify-center text-[#00373f] mb-4">
                  <Sparkles className="w-5 h-5 text-[#00373f]" />
                </div>
                <h3 className="font-bold text-[#00373f] text-base mb-2">
                  Custom Builds on Demand
                </h3>
                <p className="text-xs sm:text-sm text-[#40484a] leading-relaxed">
                  Need tailored architecture? Submit your specifications and our team pairs you with a verified developer.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. High-Craft Call-to-Action (CTA) Section ─────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 w-full">
          <div className="relative rounded-3xl bg-[#00373f] text-white overflow-hidden p-8 sm:p-12 md:p-16 shadow-2xl">
            {/* Ambient Orb Accent inside CTA */}
            <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-[#006c50] opacity-35 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-[#8cf7ce] opacity-20 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#8cf7ce] text-xs font-bold mb-4 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-[#8cf7ce]" />
                <span>Join Verified Builders &amp; Innovators</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
                Ready to showcase your software or discover your next build?
              </h2>

              <p className="text-base sm:text-lg text-[#9ccfda] leading-relaxed mb-8 max-w-2xl">
                Join our vetted community of independent engineers, product designers, and technical founders. Connect directly with makers or request custom architecture tailored to your specifications.
              </p>

              {/* CTA Actions */}
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <Link href="/projects">
                  <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#8cf7ce] text-[#002116] font-bold text-sm shadow-lg hover:bg-[#6fdab3] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
                    <Rocket className="w-4 h-4 text-[#002116]" />
                    <span>Explore All Projects</span>
                  </button>
                </Link>
                <Link href="/custom-project">
                  <button className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-white/15">
                    <span>Request Custom Software</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-[#9ccfda] text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#8cf7ce]" />
                  Direct developer routing
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#8cf7ce]" />
                  Verified production repositories
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#8cf7ce]" />
                  Zero buyer commission
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
