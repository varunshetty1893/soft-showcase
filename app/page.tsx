// app/page.tsx
// Public Homepage for Soft Showcase — Refined neutral palette with intentional brand accents.
// 90% neutral (#F8FAFA, #FFFFFF, #D9E2E4), 8% dark teal (#155761), 2% mint accent (#DDF4EC).

import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getPublishedProjects } from "@/lib/db/queries/projects";
import type { ProjectCardData } from "@/components/projects/ProjectCard";
import { APP_NAME, APP_URL } from "@/config/constants";
import { safeJsonLd } from "@/lib/utils";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { ValuePropsSection } from "@/components/home/ValuePropsSection";
import { PartnerTeaserSection } from "@/components/home/PartnerTeaserSection";
import { CtaBannerSection } from "@/components/home/CtaBannerSection";

// Public catalog cache revalidation interval: 60s
export const revalidate = 60;

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
      {/* Schema.org Structured Data with script-breakout safe serialization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(organizationSchema) }}
      />

      <Navbar />

      <main className="flex-1 w-full">
        {/* 1. Hero */}
        <HeroSection />

        {/* 2. Featured Projects */}
        <FeaturedSection featuredProjects={featuredProjects} />

        {/* 3. Taxonomy & Categories */}
        <CategoriesSection />

        {/* 4. Methodology / How It Works */}
        <HowItWorksSection />

        {/* 5. Values & Bento */}
        <ValuePropsSection />

        {/* 6. Partner Teaser */}
        <PartnerTeaserSection />

        {/* 7. CTA Banner */}
        <CtaBannerSection />
      </main>

      <Footer />
    </div>
  );
}
