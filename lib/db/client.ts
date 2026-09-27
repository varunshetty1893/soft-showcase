/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/db/client.ts
// Prisma client with resilient in-memory fallback for AI Studio.
// If DATABASE_URL is not set or unreachable, an in-memory mock is used so the app boots and functions immediately.

import { PrismaClient } from "@prisma/client";
import { DEFAULT_CATEGORIES } from "@/config/categories";
import { DEFAULT_TECHNOLOGIES } from "@/config/technologies";

// Seeded Categories
const initialCategories = DEFAULT_CATEGORIES.map((cat, idx) => ({
  id: `cat-${idx + 1}`,
  name: cat.name,
  slug: cat.slug,
  description: cat.description,
  iconName: cat.iconName,
  sortOrder: cat.sortOrder,
  isActive: true,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
}));

// Seeded Technologies
const initialTechnologies = DEFAULT_TECHNOLOGIES.map((tech, idx) => ({
  id: `tech-${idx + 1}`,
  name: tech.name,
  slug: tech.slug,
  iconUrl: null,
  isActive: true,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
}));

// Seeded Providers
const initialProviders = [
  {
    id: "prov-1",
    displayName: "Elena Vance",
    email: "elena@vancestudios.dev",
    whatsappNumber: "14155552671",
    bio: "Full-stack engineer specializing in AI-integrated Next.js and Python architectures.",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces",
    isActive: true,
    showEmail: true,
    showWhatsapp: true,
    providerConsentConfirmed: true,
    providerConsentConfirmedAt: new Date("2025-01-01"),
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "prov-2",
    displayName: "Marcus Chen",
    email: "marcus@chencraft.io",
    whatsappNumber: "14155559812",
    bio: "Mobile and distributed systems builder with 8+ years building production apps.",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
    isActive: true,
    showEmail: true,
    showWhatsapp: true,
    providerConsentConfirmed: true,
    providerConsentConfirmedAt: new Date("2025-01-01"),
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
];

// Seeded Projects
const initialProjects = [
  {
    id: "proj-1",
    title: "AI Resume & Portfolio Analyzer",
    slug: "ai-resume-analyzer",
    shortDescription:
      "ATS score optimizer and skill gap engine powered by generative AI with candidate dashboard.",
    fullDescription:
      "A complete full-stack platform for career coaches, job seekers, and recruiters. Evaluates resumes against target job descriptions, computes ATS pass scores, and generates actionable rewrite suggestions.",
    status: "PUBLISHED",
    featured: true,
    priceMode: "FIXED",
    price: 24999,
    demoUrl: "https://example.com/demo/resume-analyzer",
    projectType: "Full-Stack Web App",
    whatsIncluded: [
      "Next.js 15 + TypeScript Frontend & Backend API",
      "PostgreSQL / Prisma schema with migrations",
      "Pre-configured ATS parsing and LLM scoring prompts",
      "Docker deployment configs and setup guide",
    ],
    categoryId: "cat-7", // AI / ML
    providerId: "prov-1",
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-10"),
  },
  {
    id: "proj-2",
    title: "OmniCart Multi-Vendor Marketplace",
    slug: "omnicart-marketplace",
    shortDescription:
      "Scalable e-commerce store with vendor portals, real-time inventory, and Stripe Connect integration.",
    fullDescription:
      "Production-ready multi-tenant e-commerce system featuring buyer checkout, vendor payout dashboards, automated tax calculation, and order tracking.",
    status: "PUBLISHED",
    featured: true,
    priceMode: "STARTING_FROM",
    price: 49999,
    demoUrl: "https://example.com/demo/omnicart",
    projectType: "E-Commerce System",
    whatsIncluded: [
      "Modular storefront with cart and checkout",
      "Vendor admin dashboard with inventory management",
      "Stripe Connect custom onboarding integration",
      "Comprehensive email notification templates",
    ],
    categoryId: "cat-3", // E-Commerce
    providerId: "prov-2",
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-15"),
  },
  {
    id: "proj-3",
    title: "PulseMetrics Analytics & Monitoring Dashboard",
    slug: "pulsemetrics-analytics-dashboard",
    shortDescription:
      "Real-time business telemetry and KPI dashboard with dark mode and custom widget drag-and-drop.",
    fullDescription:
      "Modern administrative control panel designed for high-throughput SaaS companies. Features custom chart widgets, team role management, and exportable PDF audit summaries.",
    status: "PUBLISHED",
    featured: false,
    priceMode: "CONTACT",
    price: null,
    demoUrl: "https://example.com/demo/pulsemetrics",
    projectType: "Admin Panel / Dashboard",
    whatsIncluded: [
      "Customizable KPI widget dashboard",
      "RBAC authorization and user roles",
      "RESTful API documentation",
      "Dark and light theme support",
    ],
    categoryId: "cat-5", // Admin Panel
    providerId: "prov-1",
    createdAt: new Date("2025-01-20"),
    updatedAt: new Date("2025-01-20"),
  },
];

const initialProjectImages = [
  {
    id: "img-1",
    projectId: "proj-1",
    url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop",
    storageKey: "mock-1",
    altText: "AI Resume Analyzer Dashboard",
    isPrimary: true,
    sortOrder: 1,
    createdAt: new Date("2025-01-10"),
  },
  {
    id: "img-2",
    projectId: "proj-2",
    url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=500&fit=crop",
    storageKey: "mock-2",
    altText: "OmniCart Storefront",
    isPrimary: true,
    sortOrder: 1,
    createdAt: new Date("2025-01-15"),
  },
  {
    id: "img-3",
    projectId: "proj-3",
    url: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=500&fit=crop",
    storageKey: "mock-3",
    altText: "PulseMetrics Dashboard",
    isPrimary: true,
    sortOrder: 1,
    createdAt: new Date("2025-01-20"),
  },
];

const initialProjectFeatures = [
  { id: "feat-1", projectId: "proj-1", feature: "Instant ATS score calculation", sortOrder: 1 },
  { id: "feat-2", projectId: "proj-1", feature: "Skill extraction & gap analysis", sortOrder: 2 },
  { id: "feat-3", projectId: "proj-1", feature: "Export report as PDF", sortOrder: 3 },
  { id: "feat-4", projectId: "proj-2", feature: "Multi-vendor store architecture", sortOrder: 1 },
  { id: "feat-5", projectId: "proj-2", feature: "Stripe Connect automated payouts", sortOrder: 2 },
  { id: "feat-6", projectId: "proj-3", feature: "Interactive chart widgets", sortOrder: 1 },
  { id: "feat-7", projectId: "proj-3", feature: "Audit trail and event logging", sortOrder: 2 },
];

const initialProjectSpecs = [
  { id: "spec-1", projectId: "proj-1", key: "Frontend", value: "Next.js 15, Tailwind CSS, TypeScript", sortOrder: 1 },
  { id: "spec-2", projectId: "proj-1", key: "Backend", value: "Next.js Route Handlers, Prisma", sortOrder: 2 },
  { id: "spec-3", projectId: "proj-1", key: "AI Model", value: "Gemini 2.5 Flash / OpenAI API", sortOrder: 3 },
  { id: "spec-4", projectId: "proj-2", key: "Frontend", value: "React 19, Tailwind CSS", sortOrder: 1 },
  { id: "spec-5", projectId: "proj-2", key: "Database", value: "PostgreSQL with Prisma ORM", sortOrder: 2 },
  { id: "spec-6", projectId: "proj-3", key: "Tech Stack", value: "Next.js, Recharts, Tailwind CSS", sortOrder: 1 },
];

const initialProjectFaqs = [
  { id: "faq-1", projectId: "proj-1", question: "Can this project be customized?", answer: "Yes, full source code is provided with documentation.", sortOrder: 1 },
  { id: "faq-2", projectId: "proj-2", question: "Does it support custom payment gateways?", answer: "Yes, alternative payment handlers can be easily integrated.", sortOrder: 1 },
];

const initialProjectTechnologies = [
  { projectId: "proj-1", technologyId: "tech-2" }, // Next.js
  { projectId: "proj-1", technologyId: "tech-6" }, // TypeScript
  { projectId: "proj-1", technologyId: "tech-8" }, // Tailwind CSS
  { projectId: "proj-2", technologyId: "tech-1" }, // React
  { projectId: "proj-2", technologyId: "tech-17" }, // PostgreSQL
  { projectId: "proj-3", technologyId: "tech-2" }, // Next.js
];

// In-Memory Data Store
class InMemoryStore {
  categories = [...initialCategories];
  technologies = [...initialTechnologies];
  providers = [...initialProviders];
  projects = [...initialProjects];
  projectImages = [...initialProjectImages];
  projectFeatures = [...initialProjectFeatures];
  projectSpecs = [...initialProjectSpecs];
  projectFaqs = [...initialProjectFaqs];
  projectTechnologies = [...initialProjectTechnologies];
  inquiries: any[] = [];
  customRequests: any[] = [];
  users: any[] = [
    {
      id: "user-admin",
      name: "Administrator",
      email: process.env.ADMIN_EMAIL || "admin@softshowcase.com",
      emailVerified: new Date(),
      image: null,
      isAdmin: true,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    },
  ];
  accounts: any[] = [];
  sessions: any[] = [];
  verificationTokens: any[] = [];
  auditLogs: any[] = [];
  siteSettings: any[] = [];

  resolveProject(p: any) {
    if (!p) return null;
    const category = this.categories.find((c) => c.id === p.categoryId) || this.categories[0];
    const provider = this.providers.find((pr) => pr.id === p.providerId) || this.providers[0];
    const images = this.projectImages.filter((img) => img.projectId === p.id);
    const features = this.projectFeatures.filter((f) => f.projectId === p.id);
    const specifications = this.projectSpecs.filter((s) => s.projectId === p.id);
    const faqs = this.projectFaqs.filter((faq) => faq.projectId === p.id);
    const pTechs = this.projectTechnologies.filter((pt) => pt.projectId === p.id);
    const technologies = pTechs.map((pt) => {
      const tech = this.technologies.find((t) => t.id === pt.technologyId);
      return {
        projectId: p.id,
        technologyId: pt.technologyId,
        technology: tech || { id: pt.technologyId, name: "Tech", slug: "tech" },
      };
    });

    return {
      ...p,
      category,
      provider,
      images,
      features,
      specifications,
      faqs,
      technologies,
    };
  }
}

const memoryStore = new InMemoryStore();

// Model delegate factory for in-memory operations
function createModelDelegate(modelName: string) {
  return {
    async findMany(args?: any) {
      if (modelName === "category") {
        let items = [...memoryStore.categories];
        if (args?.where?.isActive !== undefined) {
          items = items.filter((c) => c.isActive === args.where.isActive);
        }
        return items.map((c) => ({
          ...c,
          _count: { projects: memoryStore.projects.filter((p) => p.categoryId === c.id && p.status === "PUBLISHED").length },
        }));
      }

      if (modelName === "technology") {
        let items = [...memoryStore.technologies];
        if (args?.where?.isActive !== undefined) {
          items = items.filter((t) => t.isActive === args.where.isActive);
        }
        return items;
      }

      if (modelName === "projectProvider") {
        let items = [...memoryStore.providers];
        if (args?.where?.isActive !== undefined) {
          items = items.filter((p) => p.isActive === args.where.isActive);
        }
        return items;
      }

      if (modelName === "project") {
        let items = memoryStore.projects.map((p) => memoryStore.resolveProject(p));
        if (args?.where?.status) {
          items = items.filter((p: any) => p.status === args.where.status);
        }
        if (args?.where?.featured !== undefined) {
          items = items.filter((p: any) => p.featured === args.where.featured);
        }
        if (args?.where?.category?.slug) {
          items = items.filter((p: any) => p.category?.slug === args.where.category.slug);
        }
        if (args?.where?.id?.not) {
          items = items.filter((p: any) => p.id !== args.where.id.not);
        }
        if (args?.skip) {
          items = items.slice(args.skip);
        }
        if (args?.take) {
          items = items.slice(0, args.take);
        }
        return items;
      }

      if (modelName === "inquiry") {
        let items = [...memoryStore.inquiries];
        if (args?.take) items = items.slice(0, args.take);
        return items;
      }

      if (modelName === "customProjectRequest") {
        let items = [...memoryStore.customRequests];
        if (args?.take) items = items.slice(0, args.take);
        return items;
      }

      if (modelName === "auditLog") {
        let items = [...memoryStore.auditLogs];
        if (args?.take) items = items.slice(0, args.take);
        return items;
      }

      if (modelName === "user") {
        return [...memoryStore.users];
      }

      return [];
    },

    async findFirst(args?: any) {
      if (modelName === "project") {
        const items = memoryStore.projects.map((p) => memoryStore.resolveProject(p));
        if (args?.where?.slug) {
          const found = items.find((p: any) => p.slug === args.where.slug);
          return found || null;
        }
        return items[0] || null;
      }
      if (modelName === "projectProvider") {
        if (args?.where?.id) {
          return memoryStore.providers.find((p) => p.id === args.where.id) || null;
        }
        return memoryStore.providers[0] || null;
      }
      if (modelName === "category") {
        if (args?.where?.slug) {
          return memoryStore.categories.find((c) => c.slug === args.where.slug) || null;
        }
        return memoryStore.categories[0] || null;
      }
      if (modelName === "user") {
        if (args?.where?.email) {
          return memoryStore.users.find((u) => u.email.toLowerCase() === args.where.email.toLowerCase()) || null;
        }
        return memoryStore.users[0] || null;
      }
      return null;
    },

    async findUnique(args?: any) {
      if (modelName === "project") {
        if (args?.where?.id) {
          const p = memoryStore.projects.find((item) => item.id === args.where.id);
          return memoryStore.resolveProject(p);
        }
        if (args?.where?.slug) {
          const p = memoryStore.projects.find((item) => item.slug === args.where.slug);
          return memoryStore.resolveProject(p);
        }
      }
      if (modelName === "projectProvider") {
        if (args?.where?.id) {
          return memoryStore.providers.find((p) => p.id === args.where.id) || null;
        }
        if (args?.where?.email) {
          return memoryStore.providers.find((p) => p.email === args.where.email) || null;
        }
      }
      if (modelName === "category") {
        if (args?.where?.id) return memoryStore.categories.find((c) => c.id === args.where.id) || null;
        if (args?.where?.slug) return memoryStore.categories.find((c) => c.slug === args.where.slug) || null;
      }
      if (modelName === "technology") {
        if (args?.where?.id) return memoryStore.technologies.find((t) => t.id === args.where.id) || null;
        if (args?.where?.slug) return memoryStore.technologies.find((t) => t.slug === args.where.slug) || null;
      }
      if (modelName === "user") {
        if (args?.where?.id) return memoryStore.users.find((u) => u.id === args.where.id) || null;
        if (args?.where?.email) return memoryStore.users.find((u) => u.email.toLowerCase() === args.where.email.toLowerCase()) || null;
      }
      if (modelName === "siteSetting") {
        if (args?.where?.key) return memoryStore.siteSettings.find((s) => s.key === args.where.key) || null;
      }
      return null;
    },

    async count(args?: any) {
      if (modelName === "project") {
        if (args?.where?.status) {
          return memoryStore.projects.filter((p) => p.status === args.where.status).length;
        }
        return memoryStore.projects.length;
      }
      if (modelName === "projectProvider") {
        if (args?.where?.isActive !== undefined) {
          return memoryStore.providers.filter((p) => p.isActive === args.where.isActive).length;
        }
        return memoryStore.providers.length;
      }
      if (modelName === "inquiry") {
        if (args?.where?.status) {
          return memoryStore.inquiries.filter((i) => i.status === args.where.status).length;
        }
        return memoryStore.inquiries.length;
      }
      if (modelName === "customProjectRequest") {
        if (args?.where?.status) {
          return memoryStore.customRequests.filter((r) => r.status === args.where.status).length;
        }
        return memoryStore.customRequests.length;
      }
      if (modelName === "user") return memoryStore.users.length;
      if (modelName === "category") return memoryStore.categories.length;
      if (modelName === "technology") return memoryStore.technologies.length;
      return 0;
    },

    async create(args?: any) {
      const data = {
        id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(args?.data || {}),
      };

      if (modelName === "inquiry") memoryStore.inquiries.unshift(data);
      else if (modelName === "customProjectRequest") memoryStore.customRequests.unshift(data);
      else if (modelName === "project") memoryStore.projects.unshift(data);
      else if (modelName === "projectProvider") memoryStore.providers.unshift(data);
      else if (modelName === "auditLog") memoryStore.auditLogs.unshift(data);
      else if (modelName === "user") memoryStore.users.push(data);

      return data;
    },

    async update(args?: any) {
      return {
        id: args?.where?.id || `mock-${Date.now()}`,
        updatedAt: new Date(),
        ...(args?.data || {}),
      };
    },

    async delete(args?: any) {
      return { id: args?.where?.id || "mock-id" };
    },

    async upsert(args?: any) {
      const existing = await this.findUnique(args);
      if (existing) {
        return this.update({ where: args.where, data: args.update });
      }
      return this.create({ data: args.create });
    },
  };
}

// Check if a real DATABASE_URL is configured
const hasValidDatabaseUrl = Boolean(
  process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes("host:5432") &&
    process.env.DATABASE_URL.trim() !== ""
);

let realPrisma: PrismaClient | null = null;
if (hasValidDatabaseUrl) {
  try {
    realPrisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  } catch {
    realPrisma = null;
  }
}

// Proxied client that delegates to Prisma when available and falls back to memoryStore
export const db = new Proxy(
  {},
  {
    get(_target, prop: string) {
      if (prop === "$transaction") {
        return async (callbackOrArray: any) => {
          if (Array.isArray(callbackOrArray)) {
            return Promise.all(callbackOrArray);
          }
          if (typeof callbackOrArray === "function") {
            return callbackOrArray(db);
          }
          return [];
        };
      }

      if (prop === "$queryRaw" || prop === "$queryRawUnsafe") {
        return async () => [];
      }

      if (prop === "$executeRaw" || prop === "$executeRawUnsafe") {
        return async () => 0;
      }

      if (prop === "$connect" || prop === "$disconnect") {
        return async () => {};
      }

      const mockDelegate = createModelDelegate(prop);

      if (!realPrisma) {
        return mockDelegate;
      }

      const realDelegate = (realPrisma as any)[prop];
      if (!realDelegate) {
        return mockDelegate;
      }

      // Delegate with try/catch fallback to in-memory mock
      return new Proxy(realDelegate, {
        get(target, method: string) {
          const origMethod = target[method];
          if (typeof origMethod !== "function") {
            return (mockDelegate as any)[method];
          }

          return async (...args: any[]) => {
            try {
              return await origMethod.apply(target, args);
            } catch (err: any) {
              console.warn(`[AI Studio] Database operation "${prop}.${method}" failed (${err?.message || err}). Falling back to mock data.`);
              const fallbackMethod = (mockDelegate as any)[method];
              if (fallbackMethod) {
                return await fallbackMethod(...args);
              }
              return null;
            }
          };
        },
      });
    },
  }
) as unknown as PrismaClient;

export const prisma = db;
