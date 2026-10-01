// lib/db/mock/mock-store.ts
// In-memory Prisma mock store for local development and test environments when USE_MOCK_DB=true.
// Strictly excluded from production execution.

import fs from "fs";
import path from "path";
import { DEFAULT_CATEGORIES } from "@/config/categories";
import { DEFAULT_TECHNOLOGIES } from "@/config/technologies";

const PERSIST_FILE = path.join(process.cwd(), ".local_mock_store.json");

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

const initialTechnologies = DEFAULT_TECHNOLOGIES.map((tech, idx) => ({
  id: `tech-${idx + 1}`,
  name: tech.name,
  slug: tech.slug,
  iconUrl: null,
  isActive: true,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
}));

const initialProviders = [
  {
    id: "prov-1",
    userId: null,
    displayName: "Elena Vance",
    email: "elena@vancestudios.dev",
    whatsappNumber: "14155552671",
    bio: "Full-stack engineer specializing in AI-integrated Next.js and Python architectures.",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces",
    isActive: true,
    showEmail: true,
    showWhatsapp: true,
    applicationStatus: "approved",
    verificationStatus: "verified",
    skills: ["AI Integration", "Next.js Architecture", "Full-Stack Development"],
    technologies: ["Next.js", "TypeScript", "Python", "Tailwind CSS"],
    experience: "7+ years building enterprise SaaS and AI applications",
    providerConsentConfirmed: true,
    providerConsentConfirmedAt: new Date("2025-01-01"),
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "prov-2",
    userId: null,
    displayName: "Marcus Chen",
    email: "marcus@chencraft.io",
    whatsappNumber: "14155559812",
    bio: "Mobile and distributed systems builder with 8+ years building production apps.",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
    isActive: true,
    showEmail: true,
    showWhatsapp: true,
    applicationStatus: "approved",
    verificationStatus: "verified",
    skills: ["E-Commerce", "Multi-Tenant Architecture", "Stripe Connect"],
    technologies: ["React", "PostgreSQL", "Node.js", "Docker"],
    experience: "8+ years developing scalable distributed systems",
    providerConsentConfirmed: true,
    providerConsentConfirmedAt: new Date("2025-01-01"),
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
  {
    id: "prov-3",
    userId: null,
    displayName: "Devon Reed",
    email: "devon@reedcraft.dev",
    whatsappNumber: "14155553920",
    bio: "Full-Stack & Python / ML Developer. Creator of direct agricultural commerce and Smart Fitness & Diet Planner.",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=faces",
    isActive: true,
    showEmail: true,
    showWhatsapp: true,
    applicationStatus: "approved",
    verificationStatus: "verified",
    skills: ["E-Commerce Development", "Python Machine Learning", "Full-Stack Web"],
    technologies: ["PHP", "MySQL", "Python", "Flask", "JavaScript"],
    experience: "5+ years in agricultural technology and data-driven web applications",
    providerConsentConfirmed: true,
    providerConsentConfirmedAt: new Date("2025-01-01"),
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
];

const initialProjects = [
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
      "Stripe Connect direct split payments",
      "PostgreSQL schemas with Prisma ORM",
    ],
    categoryId: "cat-1",
    providerId: "prov-2",
    createdAt: new Date("2025-01-02"),
    updatedAt: new Date("2025-01-02"),
  },
  {
    id: "proj-1",
    title: "SmartDoc AI Medical Analysis Platform",
    slug: "smartdoc-ai-medical-platform",
    shortDescription:
      "HIPAA-compliant document parsing platform using Gemini 1.5 Pro to extract clinical summaries from patient records.",
    fullDescription:
      "Complete AI medical workflow designed for telehealth providers. Upload PDF records, scans, and lab reports to instantly generate structured SOAP notes, medication interaction alerts, and patient history overviews.",
    status: "PUBLISHED",
    featured: true,
    priceMode: "FIXED",
    price: 79999,
    demoUrl: "https://example.com/demo/smartdoc",
    projectType: "AI Healthcare Platform",
    whatsIncluded: [
      "Next.js 15 App Router codebase with Tailwind CSS",
      "Gemini Flash/Pro document extraction pipeline",
      "End-to-end audit logging & data masking",
      "Ready-to-deploy Docker and Vercel configurations",
    ],
    categoryId: "cat-3",
    providerId: "prov-1",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  },
];

export class InMemoryStore {
  categories = [...initialCategories];
  technologies = [...initialTechnologies];
  providers = [...initialProviders];
  projects = [...initialProjects];
  projectImages: any[] = [
    {
      id: "img-1",
      projectId: "proj-1",
      url: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=800&fit=crop",
      storageKey: "mock-smartdoc-1",
      altText: "SmartDoc AI Medical Analysis Platform Dashboard",
      isPrimary: true,
      sortOrder: 1,
    },
    {
      id: "img-2",
      projectId: "proj-2",
      url: "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=1200&h=800&fit=crop",
      storageKey: "mock-omnicart-1",
      altText: "OmniCart Multi-Vendor Marketplace Storefront",
      isPrimary: true,
      sortOrder: 1,
    },
  ];
  projectFeatures: any[] = [
    { id: "feat-1", projectId: "proj-1", feature: "Automated medical document OCR and clinical summarization", sortOrder: 1 },
    { id: "feat-2", projectId: "proj-1", feature: "HIPAA-aligned data isolation and patient record encryption", sortOrder: 2 },
    { id: "feat-3", projectId: "proj-2", feature: "Multi-vendor checkout with automated split payouts", sortOrder: 1 },
    { id: "feat-4", projectId: "proj-2", feature: "Real-time inventory and delivery tracking webhooks", sortOrder: 2 },
  ];
  projectSpecs: any[] = [
    { id: "spec-1", projectId: "proj-1", key: "Framework", value: "Next.js 15 & React 19", sortOrder: 1 },
    { id: "spec-2", projectId: "proj-1", key: "AI Engine", value: "Google Gemini 1.5 Pro / Flash", sortOrder: 2 },
    { id: "spec-3", projectId: "proj-2", key: "Payments", value: "Stripe Connect Custom Accounts", sortOrder: 1 },
    { id: "spec-4", projectId: "proj-2", key: "Database", value: "PostgreSQL & Prisma ORM", sortOrder: 2 },
  ];
  projectFaqs: any[] = [
    { id: "faq-1", projectId: "proj-1", question: "Can I deploy this on my private cloud?", answer: "Yes, full Docker compose and Kubernetes manifests are provided.", sortOrder: 1 },
    { id: "faq-2", projectId: "proj-2", question: "Does this support multi-currency checkout?", answer: "Yes, Stripe currency conversion is pre-configured.", sortOrder: 1 },
  ];
  projectTechnologies: any[] = [
    { projectId: "proj-1", technologyId: "tech-1" },
    { projectId: "proj-1", technologyId: "tech-2" },
    { projectId: "proj-2", technologyId: "tech-1" },
    { projectId: "proj-2", technologyId: "tech-4" },
  ];
  inquiries: any[] = [];
  customRequests: any[] = [];
  transactions: any[] = [];
  supportTickets: any[] = [];
  supportMessages: any[] = [];
  pendingRegistrations: any[] = [];
  users: any[] = [
    {
      id: "user-admin",
      name: "Administrator",
      email: "admin@example.com",
      emailVerified: new Date(),
      image: null,
      isAdmin: true,
      role: "admin",
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    },
  ];
  accounts: any[] = [];
  sessions: any[] = [];
  verificationTokens: any[] = [];
  auditLogs: any[] = [];
  siteSettings: any[] = [];

  constructor() {
    this.loadFromDisk();
  }

  lastLoadedMtime = 0;

  saveToDisk() {
    try {
      const dataToSave = {
        providers: this.providers,
        users: this.users,
        pendingRegistrations: this.pendingRegistrations,
        verificationTokens: this.verificationTokens,
        inquiries: this.inquiries,
        customRequests: this.customRequests,
        supportTickets: this.supportTickets,
        supportMessages: this.supportMessages,
        transactions: this.transactions,
        auditLogs: this.auditLogs,
      };
      fs.writeFileSync(PERSIST_FILE, JSON.stringify(dataToSave), "utf-8");
      try {
        const stat = fs.statSync(PERSIST_FILE);
        this.lastLoadedMtime = stat.mtimeMs;
      } catch {}
    } catch {}
  }

  loadFromDisk(force = false) {
    try {
      if (fs.existsSync(PERSIST_FILE)) {
        const stat = fs.statSync(PERSIST_FILE);
        if (!force && stat.mtimeMs <= this.lastLoadedMtime) {
          return;
        }
        this.lastLoadedMtime = stat.mtimeMs;
        const raw = fs.readFileSync(PERSIST_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.providers)) this.providers = parsed.providers;
        if (Array.isArray(parsed.users)) this.users = parsed.users;
        if (Array.isArray(parsed.pendingRegistrations)) this.pendingRegistrations = parsed.pendingRegistrations;
        if (Array.isArray(parsed.verificationTokens)) this.verificationTokens = parsed.verificationTokens;
        if (Array.isArray(parsed.inquiries)) this.inquiries = parsed.inquiries;
        if (Array.isArray(parsed.customRequests)) this.customRequests = parsed.customRequests;
        if (Array.isArray(parsed.supportTickets)) this.supportTickets = parsed.supportTickets;
        if (Array.isArray(parsed.supportMessages)) this.supportMessages = parsed.supportMessages;
        if (Array.isArray(parsed.transactions)) this.transactions = parsed.transactions;
        if (Array.isArray(parsed.auditLogs)) this.auditLogs = parsed.auditLogs;
      }
    } catch {}
  }

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

export const memoryStore = new InMemoryStore();

export function createMockPrismaClient(): any {
  return new Proxy(
    {},
    {
      get(_target, prop: string) {
        if (prop === "$transaction") {
          return async (callbackOrArray: any) => {
            if (Array.isArray(callbackOrArray)) {
              return Promise.all(callbackOrArray);
            }
            if (typeof callbackOrArray === "function") {
              return callbackOrArray(createMockPrismaClient());
            }
            return [];
          };
        }

        if (prop === "$queryRaw" || prop === "$queryRawUnsafe") {
          return async () => [];
        }

        const modelName = prop;

        return {
          async findMany(args?: any) {
            memoryStore.loadFromDisk();
            if (modelName === "project") {
              return memoryStore.projects.map((p) => memoryStore.resolveProject(p));
            }
            if (modelName === "category") return [...memoryStore.categories];
            if (modelName === "technology") return [...memoryStore.technologies];
            if (modelName === "projectProvider") return [...memoryStore.providers];
            if (modelName === "user") return [...memoryStore.users];
            if (modelName === "pendingRegistration") return [...memoryStore.pendingRegistrations];
            if (modelName === "verificationToken") {
              if (args?.where?.identifier) {
                return memoryStore.verificationTokens.filter(
                  (t) => t.identifier?.toLowerCase() === args.where.identifier.toLowerCase()
                );
              }
              return [...memoryStore.verificationTokens];
            }
            if (modelName === "inquiry") return [...memoryStore.inquiries];
            if (modelName === "transaction") return [...memoryStore.transactions];
            if (modelName === "auditLog") return [...memoryStore.auditLogs];
            return [];
          },

          async findUnique(args?: any) {
            memoryStore.loadFromDisk();
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
            if (modelName === "user") {
              if (args?.where?.id) return memoryStore.users.find((u) => u.id === args.where.id) || null;
              if (args?.where?.email) return memoryStore.users.find((u) => u.email.toLowerCase() === args.where.email.toLowerCase()) || null;
            }
            if (modelName === "pendingRegistration") {
              if (args?.where?.email) {
                return memoryStore.pendingRegistrations.find((p) => p.email.toLowerCase() === args.where.email.toLowerCase()) || null;
              }
            }
            if (modelName === "projectProvider") {
              if (args?.where?.id) return memoryStore.providers.find((p) => p.id === args.where.id) || null;
              if (args?.where?.email) return memoryStore.providers.find((p) => p.email.toLowerCase() === args.where.email.toLowerCase()) || null;
              if (args?.where?.userId) return memoryStore.providers.find((p) => p.userId === args.where.userId) || null;
            }
            if (modelName === "category") {
              if (args?.where?.slug) return memoryStore.categories.find((c) => c.slug === args.where.slug) || null;
              if (args?.where?.id) return memoryStore.categories.find((c) => c.id === args.where.id) || null;
            }
            if (modelName === "technology") {
              if (args?.where?.slug) return memoryStore.technologies.find((t) => t.slug === args.where.slug) || null;
              if (args?.where?.id) return memoryStore.technologies.find((t) => t.id === args.where.id) || null;
            }
            return null;
          },

          async findFirst(args?: any) {
            memoryStore.loadFromDisk();
            if (modelName === "project") {
              const list = memoryStore.projects.map((p) => memoryStore.resolveProject(p));
              if (args?.where?.slug) {
                return list.find((p) => p.slug === args.where.slug) || null;
              }
              return list[0] || null;
            }
            if (modelName === "user") {
              if (args?.where?.email) {
                return memoryStore.users.find((u) => u.email.toLowerCase() === args.where.email.toLowerCase()) || null;
              }
              return memoryStore.users[0] || null;
            }
            if (modelName === "projectProvider") {
              if (args?.where?.userId) {
                return memoryStore.providers.find((p) => p.userId === args.where.userId) || null;
              }
              return memoryStore.providers[0] || null;
            }
            return null;
          },

          async count() {
            if (modelName === "project") return memoryStore.projects.length;
            if (modelName === "user") return memoryStore.users.length;
            if (modelName === "projectProvider") return memoryStore.providers.length;
            return 0;
          },

          async create(args?: any) {
            const data = {
              id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              createdAt: new Date(),
              updatedAt: new Date(),
              ...(args?.data || {}),
            };

            if (modelName === "project") {
              const { features, specifications, faqs, technologies, images, ...projectData } = args?.data || {};
              const pId = data.id;
              if (features?.create && Array.isArray(features.create)) {
                for (const f of features.create) {
                  memoryStore.projectFeatures.push({ id: `mock-feat-${Date.now()}`, projectId: pId, ...f });
                }
              }
              if (specifications?.create && Array.isArray(specifications.create)) {
                for (const s of specifications.create) {
                  memoryStore.projectSpecs.push({ id: `mock-spec-${Date.now()}`, projectId: pId, ...s });
                }
              }
              if (faqs?.create && Array.isArray(faqs.create)) {
                for (const faq of faqs.create) {
                  memoryStore.projectFaqs.push({ id: `mock-faq-${Date.now()}`, projectId: pId, ...faq });
                }
              }
              if (technologies?.create && Array.isArray(technologies.create)) {
                for (const t of technologies.create) {
                  memoryStore.projectTechnologies.push({ projectId: pId, technologyId: t.technologyId });
                }
              }
              if (images?.create && Array.isArray(images.create)) {
                for (const img of images.create) {
                  memoryStore.projectImages.push({ id: `mock-img-${Date.now()}`, projectId: pId, ...img });
                }
              }
              memoryStore.projects.unshift({ ...data, ...projectData });
            } else if (modelName === "pendingRegistration") {
              const existingIdx = memoryStore.pendingRegistrations.findIndex((p) => p.email.toLowerCase() === data.email.toLowerCase());
              if (existingIdx !== -1) memoryStore.pendingRegistrations.splice(existingIdx, 1);
              memoryStore.pendingRegistrations.unshift(data);
            } else if (modelName === "user") {
              memoryStore.users.push(data);
            } else if (modelName === "verificationToken") {
              memoryStore.verificationTokens.push(data);
            } else if (modelName === "inquiry") {
              memoryStore.inquiries.unshift(data);
            } else if (modelName === "auditLog") {
              memoryStore.auditLogs.unshift(data);
            }

            memoryStore.saveToDisk();
            return data;
          },

          async upsert(args?: any) {
            const email = args?.where?.email?.toLowerCase();
            if (modelName === "pendingRegistration" && email) {
              const idx = memoryStore.pendingRegistrations.findIndex((p) => p.email.toLowerCase() === email);
              if (idx !== -1) {
                memoryStore.pendingRegistrations[idx] = {
                  ...memoryStore.pendingRegistrations[idx],
                  ...(args.update || {}),
                };
                memoryStore.saveToDisk();
                return memoryStore.pendingRegistrations[idx];
              } else {
                return this.create({ data: args.create });
              }
            }
            if (modelName === "user" && email) {
              const idx = memoryStore.users.findIndex((u) => u.email.toLowerCase() === email);
              if (idx !== -1) {
                memoryStore.users[idx] = {
                  ...memoryStore.users[idx],
                  ...(args.update || {}),
                };
                memoryStore.saveToDisk();
                return memoryStore.users[idx];
              } else {
                return this.create({ data: args.create });
              }
            }
            return this.create({ data: args?.create || {} });
          },

          async update(args?: any) {
            const targetId = args?.where?.id;
            const targetEmail = args?.where?.email?.toLowerCase();
            let coll: any[] | null = null;
            if (modelName === "user") coll = memoryStore.users;
            if (modelName === "pendingRegistration") coll = memoryStore.pendingRegistrations;
            if (modelName === "project") coll = memoryStore.projects;
            if (modelName === "projectProvider") coll = memoryStore.providers;

            if (coll) {
              const idx = coll.findIndex((item) => (targetId && item.id === targetId) || (targetEmail && item.email?.toLowerCase() === targetEmail));
              if (idx !== -1) {
                coll[idx] = { ...coll[idx], ...(args?.data || {}), updatedAt: new Date() };
                memoryStore.saveToDisk();
                return coll[idx];
              }
            }
            return { ...(args?.data || {}), id: targetId || "mock-id" };
          },

          async delete(args?: any) {
            const targetEmail = args?.where?.email?.toLowerCase();
            const targetId = args?.where?.id;
            if (modelName === "pendingRegistration" && targetEmail) {
              memoryStore.pendingRegistrations = memoryStore.pendingRegistrations.filter((p) => p.email.toLowerCase() !== targetEmail);
              memoryStore.saveToDisk();
            }
            if (modelName === "project" && targetId) {
              memoryStore.projects = memoryStore.projects.filter((p) => p.id !== targetId);
              memoryStore.saveToDisk();
            }
            return { id: targetId || "deleted" };
          },

          async deleteMany(args?: any) {
            let count = 0;
            if (modelName === "pendingRegistration" && args?.where?.email) {
              const initial = memoryStore.pendingRegistrations.length;
              memoryStore.pendingRegistrations = memoryStore.pendingRegistrations.filter((p) => p.email.toLowerCase() !== args.where.email.toLowerCase());
              count = initial - memoryStore.pendingRegistrations.length;
            }
            if (modelName === "verificationToken" && args?.where?.identifier) {
              const initial = memoryStore.verificationTokens.length;
              memoryStore.verificationTokens = memoryStore.verificationTokens.filter((t) => t.identifier?.toLowerCase() !== args.where.identifier.toLowerCase());
              count = initial - memoryStore.verificationTokens.length;
            }
            memoryStore.saveToDisk();
            return { count };
          },
        };
      },
    }
  );
}
