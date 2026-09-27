# 29 — SEO

## SEO Strategy

Soft Showcase is a project discovery platform. Strong SEO is essential for organic traffic.

Target keywords:
- "buy software projects"
- "software project showcase"
- "AI resume analyzer project"
- "[Technology] web application for sale"
- Custom project request for [category]

---

## Per-Page SEO Specification

### Homepage (`/`)

```typescript
export const metadata = {
  title: "Soft Showcase — Discover & Buy Software Projects",
  description:
    "Browse a curated catalog of software projects. Contact providers directly via WhatsApp or Email. Find AI tools, web apps, e-commerce solutions, and more.",
  openGraph: {
    title: "Soft Showcase — Discover & Buy Software Projects",
    description: "...",
    url: "https://soft-showcase.vercel.app",
    siteName: "Soft Showcase",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    type: "website",
  },
};
```

---

### Project Catalog (`/projects`)

```typescript
export const metadata = {
  title: "Browse Software Projects — Soft Showcase",
  description:
    "Explore our catalog of ready-made software projects. Filter by category, technology, and type.",
  alternates: {
    canonical: "https://soft-showcase.vercel.app/projects",
  },
};
```

---

### Project Detail (`/projects/[slug]`)

```typescript
// app/(public)/projects/[slug]/page.tsx

export async function generateMetadata({ params }) {
  const project = await getProjectBySlug(params.slug);

  if (!project) return { title: "Not Found" };

  return {
    title: `${project.title} — Soft Showcase`,
    description: project.shortDescription,
    openGraph: {
      title: project.title,
      description: project.shortDescription,
      url: `https://soft-showcase.vercel.app/projects/${project.slug}`,
      images: project.primaryImage
        ? [{ url: project.primaryImage.url, alt: project.title }]
        : [{ url: "/og-default.png" }],
      type: "website",
    },
    alternates: {
      canonical: `https://soft-showcase.vercel.app/projects/${project.slug}`,
    },
  };
}
```

---

### Static Pages

| Page | Title | Description |
|---|---|---|
| `/custom-project` | Request a Custom Project — Soft Showcase | Tell us your requirements. Our team connects you with the right developer. |
| `/login` | Sign In — Soft Showcase | Sign in with Google to track your inquiries. |

---

## Sitemap

Generate sitemap dynamically using Next.js `app/sitemap.ts`:

```typescript
// app/sitemap.ts

import { prisma } from "@/lib/db/client";

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  // Static pages
  const staticPages = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/projects`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/custom-project`, changeFrequency: "monthly", priority: 0.7 },
  ];

  // Dynamic project pages
  const projects = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });

  const projectPages = projects.map((p) => ({
    url: `${baseUrl}/projects/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...projectPages];
}
```

---

## Robots.txt

```typescript
// app/robots.ts

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/profile", "/my-inquiries", "/my-requests", "/api"],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
```

---

## Static Generation for SEO

Project detail pages should be statically generated:

```typescript
// app/(public)/projects/[slug]/page.tsx

export async function generateStaticParams() {
  const projects = await prisma.project.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });

  return projects.map((p) => ({ slug: p.slug }));
}

// Revalidate when project is updated
export const revalidate = 3600; // 1 hour
```

When a project is published or updated, call:

```typescript
revalidatePath(`/projects/${slug}`);
revalidatePath("/projects");
```

---

## Structured Data (Optional V1)

For project pages, consider adding JSON-LD:

```typescript
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: project.title,
  description: project.shortDescription,
  image: project.primaryImage?.url,
  offers: {
    "@type": "Offer",
    availability: "https://schema.org/InStock",
    priceCurrency: "INR",
    price: project.price ?? "Contact for price",
  },
};
```

---

## SEO Checklist

- [ ] Unique title tag on every page
- [ ] Unique meta description on every page
- [ ] Canonical URL on every page
- [ ] OpenGraph tags on all public pages
- [ ] OpenGraph image for all projects (use primary image)
- [ ] Sitemap.xml generated and includes all published projects
- [ ] Robots.txt blocks admin and API routes
- [ ] Static generation for project detail pages
- [ ] Revalidation on project publish/update
- [ ] Alt text on all project images
- [ ] Semantic HTML (h1, h2, nav, main, article, footer)
- [ ] Single h1 per page
