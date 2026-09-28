// app/page.tsx
// Public Homepage for Soft Showcase — Refined neutral palette with intentional brand accents.
// 90% neutral (#F8FAFA, #FFFFFF, #D9E2E4), 8% dark teal (#155761), 2% mint accent (#DDF4EC).

import Link from "next/link";
import Image from "next/image";
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
  Layers,
  Terminal,
  FileCode2,
  Ban,
  Handshake,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ScrollFade } from "@/components/ui/ScrollFade";
import { DEFAULT_CATEGORIES } from "@/config/categories";
import { getPublishedProjects } from "@/lib/db/queries/projects";
import { ProjectCard, type ProjectCardData } from "@/components/projects/ProjectCard";
import type { Metadata } from "next";
import { APP_NAME, APP_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: "Soft Showcase - Discover Software Projects",
  description:
    "Explore curated software projects, developer tools, and web applications built by verified creators. Connect directly with builders via WhatsApp and email.",
  alternates: {
    canonical: `${APP_URL}/`,
  },
  openGraph: {
    title: "Soft Showcase - Discover Software Projects",
    description:
      "Explore curated software projects, developer tools, and web applications built by verified creators. Connect directly with builders via WhatsApp and email.",
    url: `${APP_URL}/`,
    siteName: APP_NAME,
    type: "website",
    images: [
      {
        url: `${APP_URL}/logo.png`,
        width: 800,
        height: 600,
        alt: `${APP_NAME} — Software Discovery Platform`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Soft Showcase - Discover Software Projects",
    description:
      "Explore curated software projects, developer tools, and web applications built by verified creators. Connect directly with builders via WhatsApp and email.",
    images: [`${APP_URL}/logo.png`],
  },
};

const categoryIconMap: Record<string, React.ReactNode> = {
  Globe: <Globe className="w-5 h-5" />,
  Smartphone: <Smartphone className="w-5 h-5" />,
  ShoppingCart: <ShoppingCart className="w-5 h-5" />,
  Layout: <Layout className="w-5 h-5" />,
  Settings: <Settings className="w-5 h-5" />,
  Server: <Server className="w-5 h-5" />,
  Brain: <Brain className="w-5 h-5" />,
  Package: <Package className="w-5 h-5" />,
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

export default async function HomePage() {
  const baseUrl = APP_URL.replace(/\/$/, "");

  let featuredProjects: ProjectCardData[] = [];
  try {
    const res = await getPublishedProjects({ featured: true, pageSize: 6 });
    featuredProjects = res.projects;
    if (featuredProjects.length === 0) {
      const allRes = await getPublishedProjects({ pageSize: 6 });
      featuredProjects = allRes.projects;
    }
  } catch (err) {
    console.warn("Could not load featured projects for homepage:", err);
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Soft Showcase",
    url: `${baseUrl}/`,
    description:
      "Explore curated software projects, developer tools, and web applications built by verified creators. Connect directly with builders via WhatsApp and email.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/projects?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Soft Showcase",
    url: `${baseUrl}/`,
    logo: `${baseUrl}/logo.png`,
    description: "Curated software project discovery platform connecting businesses with verified software developers and creators.",
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFA] text-[#102124] font-sans selection:bg-[#DDF4EC] selection:text-[#102124]">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <Navbar />

      <main className="flex-1 w-full">
        {/* ── 1. Hero Section ────────────────────────────────────────────── */}
        <div className="relative w-full overflow-hidden pt-8 pb-16 md:pt-16 md:pb-24">
          {/* Subtle Technical Dot Pattern */}
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(#52626712_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* Very Subtle Ambient Depth (Non-green, low opacity) */}
          <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[#155761]/5 via-[#F3F7F7]/60 to-transparent blur-3xl rounded-full z-0" />

          <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            {/* Top Badge */}
            <ScrollFade direction="down" duration={0.5}>
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white shadow-xs border border-[#D9E2E4] mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2F7D78] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2F7D78]" />
                </span>
                <span className="text-xs font-semibold text-[#102124] tracking-wide uppercase">
                  Curated Software Discovery
                </span>
                <span className="w-1 h-1 rounded-full bg-[#D9E2E4]" />
                <span className="text-xs font-semibold text-[#155761]">
                  Verified Direct Routing
                </span>
              </div>
            </ScrollFade>

            {/* Hero Headline */}
            <ScrollFade direction="up" duration={0.6} delay={0.1}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[62px] font-bold tracking-tight text-[#102124] max-w-4xl mx-auto leading-[1.12] mb-6">
                Discover exceptional software crafted with{" "}
                <span className="text-[#155761]">
                  precision and purpose.
                </span>
              </h1>
            </ScrollFade>

            {/* Subtitle */}
            <ScrollFade direction="up" duration={0.6} delay={0.2}>
              <p className="text-base sm:text-lg md:text-xl text-[#526267] max-w-2xl mx-auto mb-10 leading-relaxed">
                Explore handpicked software solutions, developer toolkits, and production-ready applications built by verified creators worldwide. Connect directly via WhatsApp or email with zero middleman fees.
              </p>
            </ScrollFade>

            {/* CTA Action Buttons */}
            <ScrollFade direction="up" duration={0.6} delay={0.3}>
              <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
                <Link href="/projects">
                  <button className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#155761] text-white font-semibold text-sm shadow-xs hover:bg-[#10474F] hover:shadow transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
                    <span>Explore Showcase</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/custom-project">
                  <button className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white text-[#102124] font-semibold text-sm shadow-xs border border-[#D9E2E4] hover:bg-[#F3F7F7] hover:border-[#155761]/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
                    <Rocket className="w-4 h-4 text-[#155761]" />
                    <span>Request Custom Build</span>
                  </button>
                </Link>
              </div>
            </ScrollFade>

            {/* Live Metric Chips */}
            <ScrollFade direction="up" duration={0.6} delay={0.4}>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[#526267] mb-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#D9E2E4] shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-[#2F7D78]" />
                  <span>
                    <strong className="text-[#102124] font-semibold">Verified</strong> Independent Providers
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#D9E2E4] shadow-xs">
                  <MessageCircle className="w-4 h-4 text-[#2F7D78]" />
                  <span>
                    <strong className="text-[#102124] font-semibold">Direct</strong> WhatsApp &amp; Email Routing
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#D9E2E4] shadow-xs">
                  <ShieldCheck className="w-4 h-4 text-[#2F7D78]" />
                  <span>
                    <strong className="text-[#102124] font-semibold">100%</strong> Zero Middleman Fees
                  </span>
                </div>
              </div>
            </ScrollFade>
          </section>
        </div>

        {/* ── 2. Featured Projects Showcase ─────────────────────────────── */}
        <section id="featured-projects" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <ScrollFade direction="up">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#D9E2E4] text-[#155761] text-xs font-semibold mb-3 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-[#2F7D78]" />
                  <span>Curated &amp; Production Ready</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#102124]">
                  Featured Software Solutions
                </h2>
                <p className="text-sm sm:text-base text-[#526267] mt-2 max-w-xl leading-relaxed">
                  Hand-selected full-stack architectures, mobile apps, and machine learning models ready for immediate deployment or custom scoping.
                </p>
              </div>

              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#155761] hover:text-[#2F7D78] transition-colors self-start md:self-auto group"
              >
                <span>Browse All Projects</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollFade>

          {featuredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map((p, idx) => (
                <ScrollFade key={p.id} direction="up" delay={idx * 0.08} duration={0.4}>
                  <ProjectCard project={p} />
                </ScrollFade>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#D9E2E4]">
              <p className="text-sm text-[#526267]">Browse our complete software catalog to discover ready-to-deploy projects.</p>
              <Link href="/projects" className="mt-4 inline-block">
                <button className="px-5 py-2.5 rounded-xl bg-[#155761] text-white text-xs font-semibold shadow-xs hover:bg-[#10474F] transition-colors cursor-pointer">
                  Explore Projects Catalog
                </button>
              </Link>
            </div>
          )}
        </section>

        {/* ── 3. Curated Categories Section ──────────────────────────────── */}
        <section id="categories" className="w-full bg-[#F8FAFA] py-20 px-4 sm:px-6 lg:px-8 border-y border-[#D9E2E4] scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <ScrollFade direction="up">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#D9E2E4] text-[#155761] text-xs font-semibold mb-3">
                    <Layers className="w-3.5 h-3.5 text-[#2F7D78]" />
                    <span>Curated Taxonomy</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#102124]">
                    Explore by Ecosystem &amp; Discipline
                  </h2>
                  <p className="text-sm sm:text-base text-[#526267] mt-2 max-w-xl leading-relaxed">
                    Structured directories vetted by engineers. Discover solutions segmented by operational utility and architectural integrity.
                  </p>
                </div>

                <Link
                  href="/projects"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#155761] hover:text-[#2F7D78] transition-colors self-start md:self-auto group"
                >
                  <span>View All Categories</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </ScrollFade>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {DEFAULT_CATEGORIES.map((cat, idx) => {
                const tags = categoryTagsMap[cat.slug] || ["Software", "Custom", "Verified"];
                return (
                  <ScrollFade key={cat.slug} direction="up" delay={idx * 0.05} duration={0.4}>
                    <Link
                      href={`/projects?category=${cat.slug}`}
                      className="group p-6 rounded-2xl bg-white border border-[#D9E2E4] shadow-xs hover:shadow-md hover:-translate-y-0.5 hover:border-[#155761]/40 transition-all duration-200 flex flex-col justify-between h-full"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-11 h-11 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center text-[#155761] group-hover:bg-[#155761] group-hover:text-white transition-colors">
                            {categoryIconMap[cat.iconName] || <Code2 className="w-5 h-5" />}
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#F3F7F7] text-[#526267] text-[11px] font-medium border border-[#D9E2E4]">
                            Active
                          </span>
                        </div>
                        <h3 className="font-bold text-[#102124] text-base group-hover:text-[#155761] transition-colors mb-1.5">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-[#526267] line-clamp-2 leading-relaxed mb-4">
                          {cat.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[#F3F7F7]">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded bg-[#F3F7F7] text-[#526267] text-[11px] font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </ScrollFade>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── 3. How Soft Showcase Works (Methodology) ───────────────────── */}
        <section id="how-it-works" className="w-full bg-[#F8FAFA] py-20 px-4 sm:px-6 lg:px-8 relative scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <ScrollFade direction="up">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-xs font-bold text-[#155761] uppercase tracking-wider">
                  Methodology
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#102124] mt-1">
                  How Soft Showcase Works
                </h2>
                <p className="text-sm sm:text-base text-[#526267] mt-2 leading-relaxed">
                  From technical inspection to production adoption, discovery is engineered to be frictionless and reliable.
                </p>
              </div>
            </ScrollFade>

            {/* 3 Steps Connected Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <ScrollFade direction="up" delay={0.1} duration={0.5}>
                <div className="rounded-2xl bg-white p-8 border border-[#D9E2E4] shadow-xs flex flex-col justify-between group hover:shadow-md hover:border-[#155761]/30 transition-all duration-200 h-full">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center text-sm font-bold text-[#155761]">
                        01
                      </span>
                      <Search className="w-5 h-5 text-[#2F7D78]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#102124] mb-3">
                      Discover &amp; Evaluate
                    </h3>
                    <p className="text-sm text-[#526267] leading-relaxed mb-6">
                      Browse verified software with unfiltered metrics, technical architecture breakdowns, and direct demo access.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center gap-3">
                    <ShieldCheck className="w-4 h-4 text-[#2F7D78] shrink-0" />
                    <span className="text-xs text-[#102124] font-medium">
                      Strict sanity check on code &amp; uptime
                    </span>
                  </div>
                </div>
              </ScrollFade>

              {/* Step 2 */}
              <ScrollFade direction="up" delay={0.2} duration={0.5}>
                <div className="rounded-2xl bg-white p-8 border border-[#D9E2E4] shadow-xs flex flex-col justify-between group hover:shadow-md hover:border-[#155761]/30 transition-all duration-200 h-full">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center text-sm font-bold text-[#155761]">
                        02
                      </span>
                      <MessageCircle className="w-5 h-5 text-[#2F7D78]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#102124] mb-3">
                      Connect with Makers
                    </h3>
                    <p className="text-sm text-[#526267] leading-relaxed mb-6">
                      Direct communication channels with verified builders and lead engineers without middleman friction or fee markups.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center gap-3">
                    <Zap className="w-4 h-4 text-[#2F7D78] shrink-0" />
                    <span className="text-xs text-[#102124] font-medium">
                      Encrypted WhatsApp &amp; direct email
                    </span>
                  </div>
                </div>
              </ScrollFade>

              {/* Step 3 */}
              <ScrollFade direction="up" delay={0.3} duration={0.5}>
                <div className="rounded-2xl bg-white p-8 border border-[#D9E2E4] shadow-xs flex flex-col justify-between group hover:shadow-md hover:border-[#155761]/30 transition-all duration-200 h-full">
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center text-sm font-bold text-[#155761]">
                        03
                      </span>
                      <Rocket className="w-5 h-5 text-[#2F7D78]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#102124] mb-3">
                      Ship &amp; Integrate
                    </h3>
                    <p className="text-sm text-[#526267] leading-relaxed mb-6">
                      Acquire the codebase directly, hire the provider for customized adaptations, or kickstart your own production rollout.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-[#2F7D78] shrink-0" />
                    <span className="text-xs text-[#102124] font-medium">
                      Repository handover or custom engineering
                    </span>
                  </div>
                </div>
              </ScrollFade>
            </div>
          </div>
        </section>

        {/* ── 4. Built for Clarity and Direct Connection ──────────────────── */}
        <section id="why-us" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full scroll-mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Narrative */}
            <ScrollFade direction="left" duration={0.6} className="lg:col-span-5 flex flex-col gap-4">
              <span className="text-xs font-bold text-[#155761] uppercase tracking-wider">
                Uncompromising Principles
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#102124] leading-tight">
                Built for clarity and direct connection.
              </h2>
              <p className="text-base sm:text-lg text-[#526267] leading-relaxed">
                Traditional discovery marketplaces take massive commissions and lock down conversations. Soft Showcase is calibrated exclusively for engineering fidelity and transparent peer validation.
              </p>

              {/* Brand Accent Fragment with real Logo */}
              <div className="p-4 rounded-xl bg-white border border-[#D9E2E4] flex items-center gap-4 mt-2 shadow-xs">
                <Image
                  src="/logo.png"
                  alt="Soft Showcase"
                  width={110}
                  height={23}
                  className="h-6 w-auto object-contain shrink-0"
                />
                <div>
                  <span className="text-xs font-bold text-[#102124] block">
                    The Independent Standard
                  </span>
                  <span className="text-xs text-[#526267]">
                    Connecting verified software creators and buyers
                  </span>
                </div>
              </div>
            </ScrollFade>

            {/* Right Column: 2x2 Feature Bento Cards */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Feature 1 */}
              <ScrollFade direction="up" delay={0.1} duration={0.5}>
                <div className="p-6 rounded-2xl bg-white border border-[#D9E2E4] shadow-xs hover:shadow-sm hover:border-[#155761]/30 transition-all h-full">
                  <div className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center text-[#155761] mb-4">
                    <Ban className="w-5 h-5 text-[#155761]" />
                  </div>
                  <h3 className="font-bold text-[#102124] text-base mb-2">
                    Zero Sponsored Noise
                  </h3>
                  <p className="text-xs sm:text-sm text-[#526267] leading-relaxed">
                    Strict editorial standards where no provider can pay for algorithm promotion or featured slots.
                  </p>
                </div>
              </ScrollFade>

              {/* Feature 2 */}
              <ScrollFade direction="up" delay={0.2} duration={0.5}>
                <div className="p-6 rounded-2xl bg-white border border-[#D9E2E4] shadow-xs hover:shadow-sm hover:border-[#155761]/30 transition-all h-full">
                  <div className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center text-[#2F7D78] mb-4">
                    <Handshake className="w-5 h-5 text-[#2F7D78]" />
                  </div>
                  <h3 className="font-bold text-[#102124] text-base mb-2">
                    Direct Maker Channels
                  </h3>
                  <p className="text-xs sm:text-sm text-[#526267] leading-relaxed">
                    Reach creators directly via encrypted WhatsApp and authenticated email without commission fees.
                  </p>
                </div>
              </ScrollFade>

              {/* Feature 3 */}
              <ScrollFade direction="up" delay={0.3} duration={0.5}>
                <div className="p-6 rounded-2xl bg-white border border-[#D9E2E4] shadow-xs hover:shadow-sm hover:border-[#155761]/30 transition-all h-full">
                  <div className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center text-[#2F7D78] mb-4">
                    <FileCode2 className="w-5 h-5 text-[#2F7D78]" />
                  </div>
                  <h3 className="font-bold text-[#102124] text-base mb-2">
                    Technical Deep-Dives
                  </h3>
                  <p className="text-xs sm:text-sm text-[#526267] leading-relaxed">
                    Inspect stack details, database schemas, changelogs, and live interactive demos at a single glance.
                  </p>
                </div>
              </ScrollFade>

              {/* Feature 4 */}
              <ScrollFade direction="up" delay={0.4} duration={0.5}>
                <div className="p-6 rounded-2xl bg-white border border-[#D9E2E4] shadow-xs hover:shadow-sm hover:border-[#155761]/30 transition-all h-full">
                  <div className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center text-[#155761] mb-4">
                    <Sparkles className="w-5 h-5 text-[#155761]" />
                  </div>
                  <h3 className="font-bold text-[#102124] text-base mb-2">
                    Custom Builds on Demand
                  </h3>
                  <p className="text-xs sm:text-sm text-[#526267] leading-relaxed">
                    Need tailored architecture? Submit your specifications and our team pairs you with a verified developer.
                  </p>
                </div>
              </ScrollFade>
            </div>
          </div>
        </section>

        {/* ── 5. High-Craft Call-to-Action (CTA) Section ─────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 w-full">
          <ScrollFade direction="up" duration={0.7}>
            <div className="relative rounded-3xl bg-[#155761] text-white overflow-hidden p-8 sm:p-12 md:p-16 shadow-xl">
              {/* Subtle Depth Accents */}
              <div className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full bg-[#10474F] opacity-40 blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-[#2F7D78] opacity-20 blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#DDF4EC] text-xs font-semibold mb-4 backdrop-blur-xs border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-[#DDF4EC]" />
                  <span>Join Verified Builders &amp; Innovators</span>
                </div>

                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white mb-4 leading-tight">
                  Ready to showcase your software or discover your next build?
                </h2>

                <p className="text-base sm:text-lg text-white/80 leading-relaxed mb-8 max-w-2xl">
                  Join our vetted community of independent engineers, product designers, and technical founders. Connect directly with makers or request custom architecture tailored to your specifications.
                </p>

                {/* CTA Actions */}
                <div className="flex flex-wrap items-center gap-4 mb-8">
                  <Link href="/projects">
                    <button className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-[#155761] font-bold text-sm shadow-md hover:bg-[#F3F7F7] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer">
                      <Rocket className="w-4 h-4 text-[#155761]" />
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
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-white/80 text-xs font-medium">
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#DDF4EC]" />
                    Direct developer routing
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#DDF4EC]" />
                    Verified production repositories
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-[#DDF4EC]" />
                    Zero buyer commission
                  </span>
                </div>
              </div>
            </div>
          </ScrollFade>
        </section>
      </main>

      <Footer />
    </div>
  );
}
