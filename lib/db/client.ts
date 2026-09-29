/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/db/client.ts
// Prisma client with resilient in-memory fallback for AI Studio.
// If DATABASE_URL is not set or unreachable, an in-memory mock is used so the app boots and functions immediately.

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
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
    id: "prov-varun",
    userId: null,
    displayName: "Varun Shetty",
    email: "shettybvarun@gmail.com",
    whatsappNumber: "918123665363",
    bio: "Full-Stack & Python / ML Developer. Creator of Global Farmer direct agricultural commerce and Smart Fitness & Diet Planner.",
    avatarUrl: "https://avatars.githubusercontent.com/u/170342896?v=4",
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

// Seeded Projects
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
  {
    id: "proj-global-farmer",
    title: "Global Farmer — Direct Agri-Produce E-Commerce Platform",
    slug: "global-farmer",
    shortDescription:
      "PHP & MySQL direct farm-to-consumer e-commerce marketplace cutting out middlemen with cart, checkout, and full admin operations.",
    fullDescription:
      "Global Farmer is an open-source, full-stack agricultural e-commerce web platform engineered with PHP and MySQLi. It directly connects independent farmers with local households and commercial buyers. Features an automated customer storefront with live product galleries, responsive shopping carts, address books, order tracking, and a session-protected admin control panel with inventory reports, order processing, and user management.",
    status: "PUBLISHED",
    featured: true,
    priceMode: "FIXED",
    price: 14999,
    demoUrl: "https://github.com/varunshetty1893/global-farmer",
    projectType: "Full-Stack E-Commerce System",
    whatsIncluded: [
      "Complete PHP 7.4+ & MySQLi Source Code",
      "Full globalfarmer_db.sql database schema with sample data",
      "Customer storefront with Cart, Checkout & Order History",
      "Session-protected /gf-manage admin panel with analytics",
      "Setup documentation for XAMPP, WAMP, and LAMP servers",
    ],
    categoryId: "cat-3", // E-Commerce
    providerId: "prov-varun",
    createdAt: new Date("2025-02-01"),
    updatedAt: new Date("2025-02-01"),
  },
  {
    id: "proj-smart-fitness",
    title: "Smart Fitness & Diet Planner",
    slug: "smart-fitness-diet-planner",
    shortDescription:
      "Intelligent Python Flask & SQLite health recommendation engine providing customized diet plans and workout routines.",
    fullDescription:
      "A smart, rule-based Python web application built with Flask and SQLite that delivers personalized diet and exercise recommendations. By analyzing user health parameters—including age, weight, height, activity level, and hydration status—the engine computes real-time BMI metrics, caloric intake requirements, and lifestyle plans, accompanied by an administrative analytics dashboard.",
    status: "PUBLISHED",
    featured: true,
    priceMode: "FIXED",
    price: 19999,
    demoUrl: "https://github.com/varunshetty1893/Smart-Fitness-Diet-Planner-Python-Project",
    projectType: "AI / Rule-Based Web App",
    whatsIncluded: [
      "Full Python 3.8+ & Flask application source code",
      "Pre-configured SQLite diet.db database and models",
      "Rule-based recommendation engine for nutrition and workouts",
      "Responsive Jinja2 HTML5 & CSS3 frontend templates",
      "Admin dashboard with user management and credential controls",
    ],
    categoryId: "cat-7", // AI / ML
    providerId: "prov-varun",
    createdAt: new Date("2025-02-05"),
    updatedAt: new Date("2025-02-05"),
  },
];

const initialProjectImages = [
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
  {
    id: "img-gf-1",
    projectId: "proj-global-farmer",
    url: "https://raw.githubusercontent.com/varunshetty1893/global-farmer/main/assets/img/header-bg.jpg",
    storageKey: "gf-1",
    altText: "Global Farmer Marketplace Header & Fresh Produce Catalog",
    isPrimary: true,
    sortOrder: 1,
    createdAt: new Date("2025-02-01"),
  },
  {
    id: "img-gf-2",
    projectId: "proj-global-farmer",
    url: "https://raw.githubusercontent.com/varunshetty1893/global-farmer/main/logo/logo.png",
    storageKey: "gf-2",
    altText: "Global Farmer Brand Logo & Identity",
    isPrimary: false,
    sortOrder: 2,
    createdAt: new Date("2025-02-01"),
  },
  {
    id: "img-fit-1",
    projectId: "proj-smart-fitness",
    url: "https://raw.githubusercontent.com/varunshetty1893/Smart-Fitness-Diet-Planner-Python-Project/main/static/images/hero-bg.png",
    storageKey: "fit-1",
    altText: "Smart Fitness & Diet Planner Recommendation Dashboard",
    isPrimary: true,
    sortOrder: 1,
    createdAt: new Date("2025-02-05"),
  },
  {
    id: "img-fit-2",
    projectId: "proj-smart-fitness",
    url: "https://raw.githubusercontent.com/varunshetty1893/Smart-Fitness-Diet-Planner-Python-Project/main/static/images/1.png",
    storageKey: "fit-2",
    altText: "Fitness & Diet Planner Analytics & Health Metrics",
    isPrimary: false,
    sortOrder: 2,
    createdAt: new Date("2025-02-05"),
  },
];

const initialProjectFeatures = [
  { id: "feat-4", projectId: "proj-2", feature: "Multi-vendor store architecture", sortOrder: 1 },
  { id: "feat-5", projectId: "proj-2", feature: "Stripe Connect automated payouts", sortOrder: 2 },
  { id: "feat-6", projectId: "proj-3", feature: "Interactive chart widgets", sortOrder: 1 },
  { id: "feat-7", projectId: "proj-3", feature: "Audit trail and event logging", sortOrder: 2 },
  // Global Farmer Features
  { id: "feat-gf-1", projectId: "proj-global-farmer", feature: "Direct farm-to-consumer store with category filtering", sortOrder: 1 },
  { id: "feat-gf-2", projectId: "proj-global-farmer", feature: "Full shopping cart, dynamic order calculation & checkout", sortOrder: 2 },
  { id: "feat-gf-3", projectId: "proj-global-farmer", feature: "Session-protected admin management (/gf-manage) dashboard", sortOrder: 3 },
  { id: "feat-gf-4", projectId: "proj-global-farmer", feature: "Customer address book, account profile and order tracking", sortOrder: 4 },
  // Smart Fitness Planner Features
  { id: "feat-fit-1", projectId: "proj-smart-fitness", feature: "Automatic Body Mass Index (BMI) calculator and health tier analysis", sortOrder: 1 },
  { id: "feat-fit-2", projectId: "proj-smart-fitness", feature: "Rule-based recommendation engine for personalized meal plans", sortOrder: 2 },
  { id: "feat-fit-3", projectId: "proj-smart-fitness", feature: "Targeted exercise suggestions tailored to fitness and activity level", sortOrder: 3 },
  { id: "feat-fit-4", projectId: "proj-smart-fitness", feature: "Hydration tracking and admin user control dashboard", sortOrder: 4 },
];

const initialProjectSpecs = [
  { id: "spec-4", projectId: "proj-2", key: "Frontend", value: "React 19, Tailwind CSS", sortOrder: 1 },
  { id: "spec-5", projectId: "proj-2", key: "Database", value: "PostgreSQL with Prisma ORM", sortOrder: 2 },
  { id: "spec-6", projectId: "proj-3", key: "Tech Stack", value: "Next.js, Recharts, Tailwind CSS", sortOrder: 1 },
  // Global Farmer Specs
  { id: "spec-gf-1", projectId: "proj-global-farmer", key: "Backend", value: "PHP 7.4+ with MySQLi", sortOrder: 1 },
  { id: "spec-gf-2", projectId: "proj-global-farmer", key: "Database", value: "MySQL 5.7+ / MariaDB (globalfarmer_db.sql)", sortOrder: 2 },
  { id: "spec-gf-3", projectId: "proj-global-farmer", key: "Frontend", value: "HTML5, CSS3, JavaScript, FontAwesome", sortOrder: 3 },
  { id: "spec-gf-4", projectId: "proj-global-farmer", key: "Compatibility", value: "XAMPP / WAMP / LAMP Environments", sortOrder: 4 },
  // Smart Fitness Planner Specs
  { id: "spec-fit-1", projectId: "proj-smart-fitness", key: "Backend Framework", value: "Python 3.8+ & Flask Web Framework", sortOrder: 1 },
  { id: "spec-fit-2", projectId: "proj-smart-fitness", key: "Database", value: "SQLite (diet.db)", sortOrder: 2 },
  { id: "spec-fit-3", projectId: "proj-smart-fitness", key: "Engine", value: "Rule-Based Health & Calorie Logic Engine", sortOrder: 3 },
  { id: "spec-fit-4", projectId: "proj-smart-fitness", key: "Frontend", value: "Jinja2 Templates, HTML5 & CSS3", sortOrder: 4 },
];

const initialProjectFaqs = [
  { id: "faq-2", projectId: "proj-2", question: "Does it support custom payment gateways?", answer: "Yes, alternative payment handlers can be easily integrated.", sortOrder: 1 },
  // Global Farmer FAQ
  { id: "faq-gf-1", projectId: "proj-global-farmer", question: "How do I install Global Farmer locally?", answer: "Place the project in your XAMPP htdocs folder, import globalfarmer_db.sql into phpMyAdmin, and configure dbconnection.php.", sortOrder: 1 },
  // Smart Fitness FAQ
  { id: "faq-fit-1", projectId: "proj-smart-fitness", question: "Can the rule-based logic be expanded?", answer: "Yes, the decision engine in app.py is modular and easily extensible to include new dietary preferences or medical conditions.", sortOrder: 1 },
];

const initialProjectTechnologies = [
  { projectId: "proj-2", technologyId: "tech-1" }, // React
  { projectId: "proj-2", technologyId: "tech-17" }, // PostgreSQL
  { projectId: "proj-3", technologyId: "tech-2" }, // Next.js
  // Global Farmer Techs
  { projectId: "proj-global-farmer", technologyId: "tech-19" }, // MySQL
  { projectId: "proj-global-farmer", technologyId: "tech-7" },  // JavaScript
  // Smart Fitness Techs
  { projectId: "proj-smart-fitness", technologyId: "tech-21" }, // SQLite
  { projectId: "proj-smart-fitness", technologyId: "tech-7" },  // JavaScript
];

const PERSIST_FILE = path.join("/tmp", "softshowcase_db_state.json");

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
  transactions: any[] = [];
  supportTickets: any[] = [];
  supportMessages: any[] = [];
  users: any[] = [
    {
      id: "user-admin",
      name: "Administrator",
      email: process.env.ADMIN_EMAIL || "admin@softshowcase.com",
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
    } catch {
      // Ignore write errors in restricted environments
    }
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
        if (Array.isArray(parsed.providers)) {
          const existingIds = new Set(parsed.providers.map((p: any) => p.id));
          const existingEmails = new Set(parsed.providers.map((p: any) => p.email?.toLowerCase()));
          const extra = initialProviders.filter(
            (p) => !existingIds.has(p.id) && !existingEmails.has(p.email.toLowerCase())
          );
          this.providers = [...parsed.providers, ...extra].filter(
            (p) => p.displayName?.toLowerCase() !== "rahul" && !p.email?.toLowerCase().includes("rahul")
          );
        }
        if (Array.isArray(parsed.projects)) {
          this.projects = parsed.projects.filter((p: any) => p.slug !== "ai-resume-analyzer");
        }
        if (Array.isArray(parsed.users)) {
          const existingEmails = new Set(parsed.users.map((u: any) => u.email?.toLowerCase()));
          const extra = this.users.filter((u) => !existingEmails.has(u.email?.toLowerCase()));
          this.users = [...parsed.users, ...extra];
        }
        if (Array.isArray(parsed.verificationTokens)) {
          this.verificationTokens = parsed.verificationTokens.map((t: any) => ({
            ...t,
            expires: new Date(t.expires),
          }));
        }
        if (Array.isArray(parsed.inquiries)) this.inquiries = parsed.inquiries;
        if (Array.isArray(parsed.customRequests)) this.customRequests = parsed.customRequests;
        if (Array.isArray(parsed.supportTickets)) this.supportTickets = parsed.supportTickets;
        if (Array.isArray(parsed.supportMessages)) this.supportMessages = parsed.supportMessages;
        if (Array.isArray(parsed.transactions)) this.transactions = parsed.transactions;
        if (Array.isArray(parsed.auditLogs)) this.auditLogs = parsed.auditLogs;
      }
    } catch {
      // Ignore read errors
    }
  }

  resolveTransaction(t: any) {
    if (!t) return null;
    const partner = this.providers.find((p) => p.id === t.partnerId) || null;
    const solution = this.projects.find((p) => p.id === t.solutionId) || null;
    const customer = this.users.find((u) => u.id === t.customerId) || null;
    const enquiry = this.inquiries.find((i) => i.id === t.enquiryId) || null;
    return {
      ...t,
      partner,
      solution,
      customer,
      enquiry,
    };
  }

  resolveTicket(t: any) {
    if (!t) return null;
    const messages = this.supportMessages.filter((m) => m.ticketId === t.id);
    const requester = this.users.find((u) => u.id === t.requesterId) || null;
    return {
      ...t,
      messages,
      requester,
    };
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

const globalForMemory = globalThis as unknown as {
  memoryStore?: InMemoryStore;
};

export const memoryStore = globalForMemory.memoryStore || new InMemoryStore();
globalForMemory.memoryStore = memoryStore;

function filterProjectItem(p: any, where?: any): boolean {
  if (!where) return true;

  if (where.id) {
    if (typeof where.id === "string" && p.id !== where.id) return false;
    if (where.id.not && p.id === where.id.not) return false;
    if (Array.isArray(where.id.in) && !where.id.in.includes(p.id)) return false;
  }

  if (p.slug === "ai-resume-analyzer") return false;
  const pProvider = p.provider || memoryStore.providers.find((pr) => pr.id === p.providerId);
  if (pProvider?.displayName?.toLowerCase() === "rahul" || pProvider?.email?.toLowerCase().includes("rahul")) {
    return false;
  }

  if (where.provider?.isActive !== undefined) {
    if (!pProvider || pProvider.isActive !== where.provider.isActive) return false;
  }

  if (where.slug && p.slug !== where.slug) return false;
  if (where.status && p.status !== where.status) return false;
  if (where.featured !== undefined && Boolean(p.featured) !== Boolean(where.featured)) return false;
  if (where.providerId && p.providerId !== where.providerId) return false;
  if (where.categoryId && p.categoryId !== where.categoryId) return false;

  if (where.category?.slug && p.category?.slug !== where.category.slug) {
    return false;
  }

  if (where.technologies?.some?.technology?.slug) {
    const tSlug = where.technologies.some.technology.slug;
    const hasTech = p.technologies?.some(
      (pt: any) => pt.technology?.slug === tSlug || pt.slug === tSlug
    );
    if (!hasTech) return false;
  }

  if (Array.isArray(where.OR)) {
    const matched = where.OR.some((cond: any) => {
      if (cond.title?.contains) {
        if (p.title?.toLowerCase().includes(cond.title.contains.toLowerCase())) {
          return true;
        }
      }
      if (cond.shortDescription?.contains) {
        if (p.shortDescription?.toLowerCase().includes(cond.shortDescription.contains.toLowerCase())) {
          return true;
        }
      }
      return false;
    });
    if (!matched) return false;
  }

  return true;
}

function sortProjectItems(items: any[], orderBy?: any): any[] {
  if (!orderBy) return items;
  const rules = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...items].sort((a, b) => {
    for (const rule of rules) {
      if (rule.featured) {
        const valA = a.featured ? 1 : 0;
        const valB = b.featured ? 1 : 0;
        if (valA !== valB) {
          return rule.featured === "desc" ? valB - valA : valA - valB;
        }
      }
      if (rule.createdAt) {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        if (timeA !== timeB) {
          return rule.createdAt === "desc" ? timeB - timeA : timeA - timeB;
        }
      }
      if (rule.title) {
        const cmp = a.title.localeCompare(b.title);
        if (cmp !== 0) {
          return rule.title === "desc" ? -cmp : cmp;
        }
      }
    }
    return 0;
  });
}

// Model delegate factory for in-memory operations
function createModelDelegate(modelName: string) {
  return {
    async findMany(args?: any) {
      memoryStore.loadFromDisk();
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
        items = items.filter((p) => filterProjectItem(p, args?.where));
        items = sortProjectItems(items, args?.orderBy);
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

      if (modelName === "transaction") {
        let items = memoryStore.transactions.map((t) => memoryStore.resolveTransaction(t));
        if (args?.where?.partnerId) {
          items = items.filter((t: any) => t.partnerId === args.where.partnerId);
        }
        if (args?.where?.customerId) {
          items = items.filter((t: any) => t.customerId === args.where.customerId);
        }
        if (args?.where?.paymentStatus) {
          items = items.filter((t: any) => t.paymentStatus === args.where.paymentStatus);
        }
        if (args?.take) items = items.slice(0, args.take);
        return items;
      }

      if (modelName === "supportTicket") {
        let items = memoryStore.supportTickets.map((t) => memoryStore.resolveTicket(t));
        if (args?.where?.requesterId) {
          items = items.filter((t: any) => t.requesterId === args.where.requesterId);
        }
        if (args?.where?.requesterRole) {
          items = items.filter((t: any) => t.requesterRole === args.where.requesterRole);
        }
        if (args?.where?.status) {
          items = items.filter((t: any) => t.status === args.where.status);
        }
        if (args?.take) items = items.slice(0, args.take);
        return items;
      }

      if (modelName === "supportMessage") {
        let items = [...memoryStore.supportMessages];
        if (args?.where?.ticketId) {
          items = items.filter((m) => m.ticketId === args.where.ticketId);
        }
        return items;
      }

      if (modelName === "verificationToken") {
        return [...memoryStore.verificationTokens];
      }

      if (modelName === "user") {
        return [...memoryStore.users];
      }
      return [];
    },

    async findFirst(args?: any) {
      memoryStore.loadFromDisk();
      if (modelName === "project") {
        const items = memoryStore.projects.map((p) => memoryStore.resolveProject(p));
        const filtered = items.filter((p) => filterProjectItem(p, args?.where));
        return filtered[0] || null;
      }
      if (modelName === "projectProvider") {
        if (args?.where?.id) {
          return memoryStore.providers.find((p) => p.id === args.where.id) || null;
        }
        if (args?.where?.userId) {
          return memoryStore.providers.find((p) => p.userId === args.where.userId) || null;
        }
        if (args?.where?.email) {
          return memoryStore.providers.find((p) => p.email?.toLowerCase() === args.where.email.toLowerCase()) || null;
        }
        if (args?.where?.OR) {
          const match = memoryStore.providers.find((p) =>
            args.where.OR.some((condition: any) =>
              (condition.userId && p.userId === condition.userId) ||
              (condition.email && p.email?.toLowerCase() === condition.email?.toLowerCase())
            )
          );
          return match || null;
        }
        return memoryStore.providers[0] || null;
      }
      if (modelName === "verificationToken") {
        if (args?.where) {
          const match = memoryStore.verificationTokens.find((t) => {
            if (args.where.identifier && t.identifier?.toLowerCase() !== args.where.identifier.toLowerCase()) return false;
            if (args.where.token && t.token !== args.where.token) return false;
            return true;
          });
          return match || null;
        }
        return memoryStore.verificationTokens[0] || null;
      }
      if (modelName === "transaction") {
        const items = memoryStore.transactions.map((t) => memoryStore.resolveTransaction(t));
        if (args?.where?.id) return items.find((t: any) => t.id === args.where.id) || null;
        if (args?.where?.transactionNumber) return items.find((t: any) => t.transactionNumber === args.where.transactionNumber) || null;
        return items[0] || null;
      }
      if (modelName === "supportTicket") {
        const items = memoryStore.supportTickets.map((t) => memoryStore.resolveTicket(t));
        if (args?.where?.id) return items.find((t: any) => t.id === args.where.id) || null;
        if (args?.where?.ticketNumber) return items.find((t: any) => t.ticketNumber === args.where.ticketNumber) || null;
        return items[0] || null;
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
      if (modelName === "projectProvider") {
        if (args?.where?.id) {
          return memoryStore.providers.find((p) => p.id === args.where.id) || null;
        }
        if (args?.where?.email) {
          return memoryStore.providers.find((p) => p.email?.toLowerCase() === args.where.email.toLowerCase()) || null;
        }
        if (args?.where?.userId) {
          return memoryStore.providers.find((p) => p.userId === args.where.userId) || null;
        }
      }
      if (modelName === "verificationToken") {
        if (args?.where?.identifier_token) {
          return memoryStore.verificationTokens.find(
            (t) =>
              t.identifier?.toLowerCase() === args.where.identifier_token.identifier.toLowerCase() &&
              t.token === args.where.identifier_token.token
          ) || null;
        }
      }
      if (modelName === "transaction") {
        const items = memoryStore.transactions.map((t) => memoryStore.resolveTransaction(t));
        if (args?.where?.id) return items.find((t: any) => t.id === args.where.id) || null;
        if (args?.where?.transactionNumber) return items.find((t: any) => t.transactionNumber === args.where.transactionNumber) || null;
      }
      if (modelName === "supportTicket") {
        const items = memoryStore.supportTickets.map((t) => memoryStore.resolveTicket(t));
        if (args?.where?.id) return items.find((t: any) => t.id === args.where.id) || null;
        if (args?.where?.ticketNumber) return items.find((t: any) => t.ticketNumber === args.where.ticketNumber) || null;
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
        const items = memoryStore.projects.map((p) => memoryStore.resolveProject(p));
        return items.filter((p) => filterProjectItem(p, args?.where)).length;
      }
      if (modelName === "projectProvider") {
        if (args?.where?.applicationStatus) {
          return memoryStore.providers.filter((p) => p.applicationStatus === args.where.applicationStatus).length;
        }
        if (args?.where?.isActive !== undefined) {
          return memoryStore.providers.filter((p) => p.isActive === args.where.isActive).length;
        }
        return memoryStore.providers.length;
      }
      if (modelName === "transaction") {
        if (args?.where?.paymentStatus) {
          return memoryStore.transactions.filter((t) => t.paymentStatus === args.where.paymentStatus).length;
        }
        if (args?.where?.partnerId) {
          return memoryStore.transactions.filter((t) => t.partnerId === args.where.partnerId).length;
        }
        return memoryStore.transactions.length;
      }
      if (modelName === "supportTicket") {
        if (args?.where?.status) {
          return memoryStore.supportTickets.filter((t) => t.status === args.where.status).length;
        }
        if (args?.where?.requesterRole) {
          return memoryStore.supportTickets.filter((t) => t.requesterRole === args.where.requesterRole).length;
        }
        return memoryStore.supportTickets.length;
      }
      if (modelName === "inquiry") {
        if (args?.where?.status) {
          return memoryStore.inquiries.filter((i) => i.status === args.where.status).length;
        }
        if (args?.where?.providerId) {
          return memoryStore.inquiries.filter((i) => i.providerId === args.where.providerId).length;
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
      else if (modelName === "transaction") memoryStore.transactions.unshift(data);
      else if (modelName === "supportTicket") memoryStore.supportTickets.unshift(data);
      else if (modelName === "supportMessage") memoryStore.supportMessages.push(data);
      else if (modelName === "verificationToken") memoryStore.verificationTokens.push(data);
      else if (modelName === "technology") memoryStore.technologies.push(data);
      else if (modelName === "projectImage") memoryStore.projectImages.push(data);
      else if (modelName === "projectFeature") memoryStore.projectFeatures.push(data);
      else if (modelName === "projectSpecification") memoryStore.projectSpecs.push(data);
      else if (modelName === "projectFaq") memoryStore.projectFaqs.push(data);
      else if (modelName === "projectTechnology") memoryStore.projectTechnologies.push(data);

      memoryStore.saveToDisk();
      return data;
    },

    async createMany(args?: any) {
      const records = Array.isArray(args?.data) ? args.data : [];
      let count = 0;
      for (const item of records) {
        await this.create({ data: item });
        count++;
      }
      return { count };
    },

    async update(args?: any) {
      const targetId = args?.where?.id;
      const targetEmail = args?.where?.email;
      let targetCollection: any[] | null = null;
      if (modelName === "projectProvider") targetCollection = memoryStore.providers;
      else if (modelName === "project") targetCollection = memoryStore.projects;
      else if (modelName === "inquiry") targetCollection = memoryStore.inquiries;
      else if (modelName === "transaction") targetCollection = memoryStore.transactions;
      else if (modelName === "supportTicket") targetCollection = memoryStore.supportTickets;
      else if (modelName === "user") targetCollection = memoryStore.users;

      if (targetCollection) {
        let idx = -1;
        if (targetId) {
          idx = targetCollection.findIndex((item) => item.id === targetId);
        } else if (targetEmail && modelName === "user") {
          idx = targetCollection.findIndex((item) => item.email?.toLowerCase() === targetEmail.toLowerCase());
        }
        if (idx !== -1) {
          targetCollection[idx] = {
            ...targetCollection[idx],
            ...(args?.data || {}),
            updatedAt: new Date(),
          };
          memoryStore.saveToDisk();
          return targetCollection[idx];
        }
      }

      memoryStore.saveToDisk();
      return {
        id: targetId || `mock-${Date.now()}`,
        updatedAt: new Date(),
        ...(args?.data || {}),
      };
    },

    async delete(args?: any) {
      memoryStore.saveToDisk();
      return { id: args?.where?.id || "mock-id" };
    },

    async deleteMany(args?: any) {
      let count = 0;
      if (modelName === "project") {
        const initialLen = memoryStore.projects.length;
        if (args?.where?.providerId) {
          memoryStore.projects = memoryStore.projects.filter((p) => p.providerId !== args.where.providerId);
        } else if (args?.where?.slug) {
          memoryStore.projects = memoryStore.projects.filter((p) => p.slug !== args.where.slug);
        } else if (args?.where?.id?.in) {
          memoryStore.projects = memoryStore.projects.filter((p) => !args.where.id.in.includes(p.id));
        }
        count = initialLen - memoryStore.projects.length;
        memoryStore.saveToDisk();
      }
      if (modelName === "projectImage") {
        const initialLen = memoryStore.projectImages.length;
        if (args?.where?.projectId) {
          memoryStore.projectImages = memoryStore.projectImages.filter((img) => img.projectId !== args.where.projectId);
        }
        count = initialLen - memoryStore.projectImages.length;
        memoryStore.saveToDisk();
      }
      if (modelName === "projectFeature") {
        const initialLen = memoryStore.projectFeatures.length;
        if (args?.where?.projectId) {
          memoryStore.projectFeatures = memoryStore.projectFeatures.filter((f) => f.projectId !== args.where.projectId);
        }
        count = initialLen - memoryStore.projectFeatures.length;
        memoryStore.saveToDisk();
      }
      if (modelName === "projectSpecification") {
        const initialLen = memoryStore.projectSpecs.length;
        if (args?.where?.projectId) {
          memoryStore.projectSpecs = memoryStore.projectSpecs.filter((s) => s.projectId !== args.where.projectId);
        }
        count = initialLen - memoryStore.projectSpecs.length;
        memoryStore.saveToDisk();
      }
      if (modelName === "projectFaq") {
        const initialLen = memoryStore.projectFaqs.length;
        if (args?.where?.projectId) {
          memoryStore.projectFaqs = memoryStore.projectFaqs.filter((faq) => faq.projectId !== args.where.projectId);
        }
        count = initialLen - memoryStore.projectFaqs.length;
        memoryStore.saveToDisk();
      }
      if (modelName === "projectTechnology") {
        const initialLen = memoryStore.projectTechnologies.length;
        if (args?.where?.projectId) {
          memoryStore.projectTechnologies = memoryStore.projectTechnologies.filter((pt) => pt.projectId !== args.where.projectId);
        }
        count = initialLen - memoryStore.projectTechnologies.length;
        memoryStore.saveToDisk();
      }
      if (modelName === "verificationToken") {
        const identifier = args?.where?.identifier?.toLowerCase();
        if (identifier) {
          const initialLen = memoryStore.verificationTokens.length;
          memoryStore.verificationTokens = memoryStore.verificationTokens.filter(
            (t) => t.identifier?.toLowerCase() !== identifier
          );
          count = initialLen - memoryStore.verificationTokens.length;
        } else {
          count = memoryStore.verificationTokens.length;
          memoryStore.verificationTokens = [];
        }
        memoryStore.saveToDisk();
      }
      return { count };
    },

    async updateMany(args?: any) {
      let count = 0;
      if (modelName === "project") {
        memoryStore.projects.forEach((p) => {
          let match = true;
          if (args?.where?.providerId && p.providerId !== args.where.providerId) match = false;
          if (args?.where?.status && p.status !== args.where.status) match = false;
          if (match) {
            Object.assign(p, args?.data || {}, { updatedAt: new Date() });
            count++;
          }
        });
        memoryStore.saveToDisk();
      }
      return { count };
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

// Check if a real, reachable DATABASE_URL is configured
function isValidDatabaseUrl(url?: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  // Must have a real database protocol
  if (
    !trimmed.startsWith("postgresql://") &&
    !trimmed.startsWith("postgres://") &&
    !trimmed.startsWith("mysql://")
  ) {
    return false;
  }

  // Check for dummy / placeholder values commonly injected in template or container environments
  const lower = trimmed.toLowerCase();
  if (
    lower.includes("@host/") ||
    lower.includes("@host:") ||
    lower.includes("@host?") ||
    lower.includes("host:5432") ||
    lower.includes("user:password@") ||
    lower.includes("username:password@") ||
    lower.includes("placeholder") ||
    lower.includes("example.com") ||
    lower.includes("dummy") ||
    lower.includes("your-database") ||
    lower.includes("db_user:db_password")
  ) {
    return false;
  }

  return true;
}

const hasValidDatabaseUrl = isValidDatabaseUrl(process.env.DATABASE_URL);

let realPrisma: PrismaClient | null = null;
let prismaConnectionFailed = false;

if (hasValidDatabaseUrl) {
  try {
    // Keep log empty so Prisma doesn't print raw errors to stderr on network drops
    realPrisma = new PrismaClient({
      log: [],
    });
  } catch {
    realPrisma = null;
    prismaConnectionFailed = true;
  }
}

let seedCheckTriggered = false;

async function ensureDatabaseSeeded(p: PrismaClient) {
  if (seedCheckTriggered || prismaConnectionFailed || !hasValidDatabaseUrl) return;
  seedCheckTriggered = true;

  try {
    const categoryCount = await p.category.count().catch(() => 0);
    if (categoryCount === 0) {
      console.log("[Soft Showcase] Auto-seeding initial categories & technologies...");
      for (const cat of DEFAULT_CATEGORIES) {
        await p.category.upsert({
          where: { slug: cat.slug },
          update: {},
          create: cat,
        }).catch(() => null);
      }
      for (const tech of DEFAULT_TECHNOLOGIES) {
        await p.technology.upsert({
          where: { slug: tech.slug },
          update: {},
          create: tech,
        }).catch(() => null);
      }
    }

    const adminEmail = process.env.ADMIN_EMAIL || "shettymu25@gmail.com";
    if (adminEmail) {
      await p.user.upsert({
        where: { email: adminEmail },
        update: { isAdmin: true },
        create: {
          email: adminEmail,
          name: "Admin",
          isAdmin: true,
        },
      }).catch(() => null);
    }

    const gfExists = await p.project.findUnique({ where: { slug: "global-farmer" } }).catch(() => null);
    if (!gfExists) {
      console.log("[Soft Showcase] Auto-seeding initial projects & providers...");
      const varunProvider = await p.projectProvider.upsert({
        where: { email: "shettybvarun@gmail.com" },
        update: {
          displayName: "Varun Shetty",
          whatsappNumber: "918123665363",
          bio: "Full-Stack & Python / ML Developer. Creator of Global Farmer direct agricultural commerce and Smart Fitness & Diet Planner.",
          avatarUrl: "https://avatars.githubusercontent.com/u/170342896?v=4",
          showEmail: true,
          showWhatsapp: true,
          applicationStatus: "approved",
          verificationStatus: "verified",
          providerConsentConfirmed: true,
          providerConsentConfirmedAt: new Date(),
        },
        create: {
          displayName: "Varun Shetty",
          email: "shettybvarun@gmail.com",
          whatsappNumber: "918123665363",
          bio: "Full-Stack & Python / ML Developer. Creator of Global Farmer direct agricultural commerce and Smart Fitness & Diet Planner.",
          avatarUrl: "https://avatars.githubusercontent.com/u/170342896?v=4",
          showEmail: true,
          showWhatsapp: true,
          applicationStatus: "approved",
          verificationStatus: "verified",
          providerConsentConfirmed: true,
          providerConsentConfirmedAt: new Date(),
        },
      }).catch(() => null);

      if (varunProvider) {
        const ecommerceCat = await p.category.findUnique({ where: { slug: "e-commerce" } }).catch(() => null);
        const aimlCat = await p.category.findUnique({ where: { slug: "ai-ml" } }).catch(() => null);

        if (ecommerceCat) {
          await p.project.upsert({
            where: { slug: "global-farmer" },
            update: {},
            create: {
              title: "Global Farmer — Direct Agri-Produce E-Commerce Platform",
              slug: "global-farmer",
              shortDescription: "PHP & MySQL direct farm-to-consumer e-commerce marketplace cutting out middlemen with cart, checkout, and full admin operations.",
              fullDescription: "Global Farmer is an open-source, full-stack agricultural e-commerce web platform engineered with PHP and MySQLi. It directly connects independent farmers with local households and commercial buyers. Features an automated customer storefront with live product galleries, responsive shopping carts, address books, order tracking, and a session-protected admin control panel with inventory reports, order processing, and user management.",
              status: "PUBLISHED",
              featured: true,
              priceMode: "FIXED",
              price: 14999,
              demoUrl: "https://github.com/varunshetty1893/global-farmer",
              projectType: "Full-Stack E-Commerce System",
              whatsIncluded: [
                "Complete PHP 7.4+ & MySQLi Source Code",
                "Full globalfarmer_db.sql database schema with sample data",
                "Customer storefront with Cart, Checkout & Order History",
                "Session-protected /gf-manage admin panel with analytics",
                "Setup documentation for XAMPP, WAMP, and LAMP servers",
              ],
              categoryId: ecommerceCat.id,
              providerId: varunProvider.id,
              images: {
                create: [
                  {
                    url: "https://raw.githubusercontent.com/varunshetty1893/global-farmer/main/assets/img/header-bg.jpg",
                    storageKey: "gf-1",
                    altText: "Global Farmer Marketplace Header & Fresh Produce Catalog",
                    isPrimary: true,
                    sortOrder: 1,
                  },
                  {
                    url: "https://raw.githubusercontent.com/varunshetty1893/global-farmer/main/logo/logo.png",
                    storageKey: "gf-2",
                    altText: "Global Farmer Brand Logo & Identity",
                    isPrimary: false,
                    sortOrder: 2,
                  },
                ],
              },
              features: {
                create: [
                  { feature: "Direct farm-to-consumer store with category filtering", sortOrder: 1 },
                  { feature: "Full shopping cart, dynamic order calculation & checkout", sortOrder: 2 },
                  { feature: "Session-protected admin management (/gf-manage) dashboard", sortOrder: 3 },
                  { feature: "Customer address book, account profile and order tracking", sortOrder: 4 },
                ],
              },
              specifications: {
                create: [
                  { key: "Backend", value: "PHP 7.4+ with MySQLi", sortOrder: 1 },
                  { key: "Database", value: "MySQL 5.7+ / MariaDB (globalfarmer_db.sql)", sortOrder: 2 },
                  { key: "Frontend", value: "HTML5, CSS3, JavaScript, FontAwesome", sortOrder: 3 },
                  { key: "Compatibility", value: "XAMPP / WAMP / LAMP Environments", sortOrder: 4 },
                ],
              },
              faqs: {
                create: [
                  { question: "How do I install Global Farmer locally?", answer: "Place the project in your XAMPP htdocs folder, import globalfarmer_db.sql into phpMyAdmin, and configure dbconnection.php.", sortOrder: 1 },
                ],
              },
            },
          }).catch(() => null);
        }

        if (aimlCat) {
          await p.project.upsert({
            where: { slug: "smart-fitness-diet-planner" },
            update: {},
            create: {
              title: "Smart Fitness & Diet Planner",
              slug: "smart-fitness-diet-planner",
              shortDescription: "Intelligent Python Flask & SQLite health recommendation engine providing customized diet plans and workout routines.",
              fullDescription: "A smart, rule-based Python web application built with Flask and SQLite that delivers personalized diet and exercise recommendations. By analyzing user health parameters—including age, weight, height, activity level, and hydration status—the engine computes real-time BMI metrics, caloric intake requirements, and lifestyle plans, accompanied by an administrative analytics dashboard.",
              status: "PUBLISHED",
              featured: true,
              priceMode: "FIXED",
              price: 19999,
              demoUrl: "https://github.com/varunshetty1893/Smart-Fitness-Diet-Planner-Python-Project",
              projectType: "AI / Rule-Based Web App",
              whatsIncluded: [
                "Full Python 3.8+ & Flask application source code",
                "Pre-configured SQLite diet.db database and models",
                "Rule-based recommendation engine for nutrition and workouts",
                "Responsive Jinja2 HTML5 & CSS3 frontend templates",
                "Admin dashboard with user management and credential controls",
              ],
              categoryId: aimlCat.id,
              providerId: varunProvider.id,
              images: {
                create: [
                  {
                    url: "https://raw.githubusercontent.com/varunshetty1893/Smart-Fitness-Diet-Planner-Python-Project/main/static/images/hero-bg.png",
                    storageKey: "fit-1",
                    altText: "Smart Fitness & Diet Planner Recommendation Dashboard",
                    isPrimary: true,
                    sortOrder: 1,
                  },
                  {
                    url: "https://raw.githubusercontent.com/varunshetty1893/Smart-Fitness-Diet-Planner-Python-Project/main/static/images/1.png",
                    storageKey: "fit-2",
                    altText: "Fitness & Diet Planner Analytics & Health Metrics",
                    isPrimary: false,
                    sortOrder: 2,
                  },
                ],
              },
              features: {
                create: [
                  { feature: "Automatic Body Mass Index (BMI) calculator and health tier analysis", sortOrder: 1 },
                  { feature: "Rule-based recommendation engine for personalized meal plans", sortOrder: 2 },
                  { feature: "Targeted exercise suggestions tailored to fitness and activity level", sortOrder: 3 },
                  { feature: "Hydration tracking and admin user control dashboard", sortOrder: 4 },
                ],
              },
              specifications: {
                create: [
                  { key: "Backend Framework", value: "Python 3.8+ & Flask Web Framework", sortOrder: 1 },
                  { key: "Database", value: "SQLite (diet.db)", sortOrder: 2 },
                  { key: "Engine", value: "Rule-Based Health & Calorie Logic Engine", sortOrder: 3 },
                  { key: "Frontend", value: "Jinja2 Templates, HTML5 & CSS3", sortOrder: 4 },
                ],
              },
              faqs: {
                create: [
                  { question: "Can the rule-based logic be expanded?", answer: "Yes, the decision engine in app.py is modular and easily extensible to include new dietary preferences or medical conditions.", sortOrder: 1 },
                ],
              },
            },
          }).catch(() => null);

          // Automatically remove partner Rahul and his projects from the database
          const rahulProviders = await p.projectProvider.findMany({
            where: {
              OR: [
                { displayName: { equals: "Rahul", mode: "insensitive" } },
                { email: { contains: "rahul", mode: "insensitive" } },
              ],
            },
          }).catch(() => []);

          for (const rahul of rahulProviders) {
            const rahulProjects = await p.project.findMany({
              where: { providerId: rahul.id },
              select: { id: true },
            }).catch(() => []);

            const rIds = rahulProjects.map((rp) => rp.id);
            if (rIds.length > 0) {
              await p.projectImage.deleteMany({ where: { projectId: { in: rIds } } }).catch(() => null);
              await p.projectFeature.deleteMany({ where: { projectId: { in: rIds } } }).catch(() => null);
              await p.projectSpecification.deleteMany({ where: { projectId: { in: rIds } } }).catch(() => null);
              await p.projectFaq.deleteMany({ where: { projectId: { in: rIds } } }).catch(() => null);
              await p.projectTechnology.deleteMany({ where: { projectId: { in: rIds } } }).catch(() => null);
              await p.inquiry.deleteMany({ where: { projectId: { in: rIds } } }).catch(() => null);
              await p.project.deleteMany({ where: { id: { in: rIds } } }).catch(() => null);
            }

            if (rahul.userId) {
              await p.user.delete({ where: { id: rahul.userId } }).catch(() => null);
            }
            await p.projectProvider.delete({ where: { id: rahul.id } }).catch(() => null);
          }

          // Remove ai-resume-analyzer project from database if present
          const airProjects = await p.project.findMany({
            where: { slug: "ai-resume-analyzer" },
            select: { id: true },
          }).catch(() => []);

          if (airProjects.length > 0) {
            const airIds = airProjects.map((rp) => rp.id);
            await p.projectImage.deleteMany({ where: { projectId: { in: airIds } } }).catch(() => null);
            await p.projectFeature.deleteMany({ where: { projectId: { in: airIds } } }).catch(() => null);
            await p.projectSpecification.deleteMany({ where: { projectId: { in: airIds } } }).catch(() => null);
            await p.projectFaq.deleteMany({ where: { projectId: { in: airIds } } }).catch(() => null);
            await p.projectTechnology.deleteMany({ where: { projectId: { in: airIds } } }).catch(() => null);
            await p.inquiry.deleteMany({ where: { projectId: { in: airIds } } }).catch(() => null);
            await p.project.deleteMany({ where: { id: { in: airIds } } }).catch(() => null);
          }
        }
      }
    }
  } catch {
    prismaConnectionFailed = true;
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

      if (!realPrisma || prismaConnectionFailed) {
        if (process.env.NODE_ENV === "production" && hasValidDatabaseUrl) {
          throw new Error("Production database connection is unavailable");
        }
        return mockDelegate;
      }

      const realDelegate = (realPrisma as any)[prop];
      if (!realDelegate) {
        return mockDelegate;
      }

      // Delegate with try/catch fallback to in-memory mock in dev/preview only
      return new Proxy(realDelegate, {
        get(target, method: string) {
          const origMethod = target[method];
          if (typeof origMethod !== "function") {
            return (mockDelegate as any)[method];
          }

          return async (...args: any[]) => {
            if (prismaConnectionFailed || !realPrisma) {
              if (process.env.NODE_ENV === "production" && hasValidDatabaseUrl) {
                throw new Error("Production database connection is unavailable");
              }
              const fallback = (mockDelegate as any)[method];
              return fallback ? fallback(...args) : null;
            }

            try {
              ensureDatabaseSeeded(realPrisma).catch(() => null);
              return await origMethod.apply(target, args);
            } catch (dbError) {
              // Issue 10 & 11: In production or when a valid database is configured,
              // or on write operations, failures must NOT silently fall back to mock database
              // producing false success.
              const isWriteOp = ["create", "createMany", "update", "updateMany", "upsert", "delete", "deleteMany"].includes(method);
              if (process.env.NODE_ENV === "production" || hasValidDatabaseUrl || isWriteOp) {
                console.error(`Database error during ${prop}.${method}:`, dbError);
                throw dbError;
              }

              // In local development without configured DB, allow fallback for development convenience
              prismaConnectionFailed = true;
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
