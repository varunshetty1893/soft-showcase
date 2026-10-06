// tests/unit/catalog-search.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizeSearchText,
  analyzeSearchQuery,
  scoreProjectRelevance,
  rankAndFilterProjects,
  buildCatalogSuggestions,
  type SearchableProjectRecord,
} from "@/lib/search/catalog-search";
import {
  getRecentSearches,
  saveRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  personalizeSuggestions,
  MAX_RECENT_SEARCHES,
} from "@/lib/search/recent-searches";
import { DEFAULT_CATEGORIES } from "@/config/categories";
import { DEFAULT_TECHNOLOGIES } from "@/config/technologies";

const SAMPLE_CATALOG: SearchableProjectRecord[] = [
  {
    id: "proj-smartdoc",
    title: "SmartDoc AI Medical Analysis Platform",
    slug: "smartdoc-ai-medical-platform",
    shortDescription:
      "HIPAA-compliant document parsing platform using Gemini 1.5 Pro to extract clinical summaries from patient records.",
    fullDescription:
      "Complete AI medical workflow designed for telehealth providers. Upload PDF records, scans, and lab reports to instantly generate structured SOAP notes.",
    projectType: "AI Healthcare Platform",
    featured: true,
    category: {
      id: "cat-ai",
      name: "AI / Machine Learning",
      slug: "ai-machine-learning",
    },
    technologies: [
      { technology: { id: "t-next", name: "Next.js", slug: "nextjs" } },
      { technology: { id: "t-react", name: "React", slug: "react" } },
      { technology: { id: "t-py", name: "Python", slug: "python" } },
    ],
    features: [
      { feature: "Automated medical document OCR and clinical summarization" },
    ],
    specifications: [
      { key: "Framework", value: "Next.js 15 & React 19" },
      { key: "AI Engine", value: "Google Gemini 1.5 Pro / Flash" },
    ],
  },
  {
    id: "proj-fitness",
    title: "Smart Fitness & Diet Planner",
    slug: "smart-fitness-diet-planner",
    shortDescription:
      "Intelligent Python Flask & SQLite health recommendation engine providing customized diet plans and workout routines.",
    fullDescription:
      "A smart, rule-based Python web application built with Flask and SQLite that delivers personalized diet and exercise recommendations using machine learning and health metrics.",
    projectType: "AI / Rule-Based Web App",
    featured: true,
    category: {
      id: "cat-ai",
      name: "AI / Machine Learning",
      slug: "ai-machine-learning",
    },
    technologies: [
      { technology: { id: "t-py", name: "Python", slug: "python" } },
      { technology: { id: "t-flask", name: "Flask", slug: "flask" } },
      { technology: { id: "t-sqlite", name: "SQLite", slug: "sqlite" } },
    ],
    features: [
      { feature: "Rule-based recommendation engine for personalized meal plans" },
    ],
    specifications: [
      { key: "Backend Framework", value: "Python 3.8+ & Flask Web Framework" },
      { key: "Database", value: "SQLite (diet.db)" },
    ],
  },
  {
    id: "proj-omnicart",
    title: "OmniCart Multi-Vendor Marketplace",
    slug: "omnicart-marketplace",
    shortDescription:
      "Scalable full-stack e-commerce store with vendor portals, real-time inventory, and Stripe Connect integration.",
    fullDescription:
      "Production-ready multi-tenant e-commerce web application featuring buyer checkout, vendor payout dashboards, automated tax calculation, and order tracking.",
    projectType: "E-Commerce System",
    featured: true,
    category: {
      id: "cat-ecom",
      name: "E-Commerce",
      slug: "e-commerce",
    },
    technologies: [
      { technology: { id: "t-react", name: "React", slug: "react" } },
      { technology: { id: "t-pg", name: "PostgreSQL", slug: "postgresql" } },
      { technology: { id: "t-stripe", name: "Stripe", slug: "stripe" } },
    ],
    features: [
      { feature: "Multi-vendor checkout with automated split payouts" },
    ],
    specifications: [
      { key: "Database", value: "PostgreSQL & Prisma ORM" },
      { key: "Frontend", value: "React, TypeScript & Tailwind CSS" },
    ],
  },
  {
    id: "proj-student",
    title: "CampusFlow Student Management System",
    slug: "campusflow-student-management",
    shortDescription:
      "Academic administration portal for colleges with student enrollment, attendance tracking, and grade analytics.",
    fullDescription:
      "Full-stack web application built with JavaScript, Node.js, and MySQL for managing university students, faculty schedules, and exam results.",
    projectType: "Academic Admin Panel",
    featured: false,
    category: {
      id: "cat-admin",
      name: "Admin Panel",
      slug: "admin-panel",
    },
    technologies: [
      { technology: { id: "t-js", name: "JavaScript", slug: "javascript" } },
      { technology: { id: "t-node", name: "Node.js", slug: "nodejs" } },
      { technology: { id: "t-mysql", name: "MySQL", slug: "mysql" } },
    ],
    features: [
      { feature: "Automated student attendance and academic transcript generation" },
    ],
    specifications: [
      { key: "Database", value: "MySQL 8.0" },
    ],
  },
];

describe("Catalog Search Intelligence Engine", () => {
  it("normalizes punctuation, hyphens, and casing properly", () => {
    expect(normalizeSearchText("  AI / ML -- Projects! ")).toBe("ai ml projects");
    expect(normalizeSearchText("Next.js & E-Commerce")).toContain("nextjs");
    expect(normalizeSearchText("Next.js & E-Commerce")).toContain("ecommerce");
  });

  it("handles exact searches across title, tech stack, and category", () => {
    for (const query of ["Python", "React", "Flask", "Machine Learning"]) {
      const { results } = rankAndFilterProjects(SAMPLE_CATALOG, query);
      expect(results.length).toBeGreaterThan(0);
    }

    const flaskResults = rankAndFilterProjects(SAMPLE_CATALOG, "Flask").results;
    expect(flaskResults[0].id).toBe("proj-fitness");
    expect(flaskResults[0].matchedTerms).toContain("Flask");
  });

  it("handles related and abbreviation searches (AI ML, Artificial Intelligence, web dev, database)", () => {
    const aiMl = rankAndFilterProjects(SAMPLE_CATALOG, "AI ML").results;
    expect(aiMl.length).toBeGreaterThanOrEqual(2);
    expect(aiMl.map((p) => p.id)).toContain("proj-smartdoc");
    expect(aiMl.map((p) => p.id)).toContain("proj-fitness");

    const artInt = rankAndFilterProjects(SAMPLE_CATALOG, "Artificial Intelligence").results;
    expect(artInt.length).toBeGreaterThanOrEqual(2);

    const webDev = rankAndFilterProjects(SAMPLE_CATALOG, "web dev").results;
    expect(webDev.length).toBeGreaterThan(0);

    const dbSearch = rankAndFilterProjects(SAMPLE_CATALOG, "database").results;
    expect(dbSearch.length).toBeGreaterThanOrEqual(2);
  });

  it("handles partial word searches (pyth, mach, react)", () => {
    const pyth = rankAndFilterProjects(SAMPLE_CATALOG, "pyth").results;
    expect(pyth.map((p) => p.id)).toContain("proj-fitness");

    const mach = rankAndFilterProjects(SAMPLE_CATALOG, "mach").results;
    expect(mach.map((p) => p.id)).toContain("proj-fitness");

    const react = rankAndFilterProjects(SAMPLE_CATALOG, "react").results;
    expect(react.map((p) => p.id)).toContain("proj-omnicart");
  });

  it("handles minor spelling mistakes via fuzzy matching (pyhton, machne learning, javasript, postgre)", () => {
    const pyhton = rankAndFilterProjects(SAMPLE_CATALOG, "pyhton").results;
    expect(pyhton.length).toBeGreaterThan(0);
    expect(pyhton.map((p) => p.id)).toContain("proj-fitness");

    const machne = rankAndFilterProjects(SAMPLE_CATALOG, "machne learning").results;
    expect(machne.length).toBeGreaterThan(0);
    expect(machne.map((p) => p.id)).toContain("proj-fitness");

    const javasript = rankAndFilterProjects(SAMPLE_CATALOG, "javasript").results;
    expect(javasript.length).toBeGreaterThan(0);
    expect(javasript.map((p) => p.id)).toContain("proj-student");

    const postgre = rankAndFilterProjects(SAMPLE_CATALOG, "postgre").results;
    expect(postgre.length).toBeGreaterThan(0);
    expect(postgre.map((p) => p.id)).toContain("proj-omnicart");
  });

  it("handles multi-word intent queries and ranks stronger combinations higher", () => {
    const aiMlProject = rankAndFilterProjects(SAMPLE_CATALOG, "AI ML project").results;
    expect(aiMlProject.length).toBeGreaterThanOrEqual(2);

    const pyWebApp = rankAndFilterProjects(SAMPLE_CATALOG, "Python web application").results;
    expect(pyWebApp.length).toBeGreaterThan(0);
    expect(pyWebApp[0].id).toBe("proj-fitness");

    const studentMgmt = rankAndFilterProjects(SAMPLE_CATALOG, "student management system").results;
    expect(studentMgmt.length).toBeGreaterThan(0);
    expect(studentMgmt[0].id).toBe("proj-student");

    const fullstackEcom = rankAndFilterProjects(SAMPLE_CATALOG, "full stack ecommerce").results;
    expect(fullstackEcom.length).toBeGreaterThan(0);
    expect(fullstackEcom[0].id).toBe("proj-omnicart");
  });

  it("returns zero results for completely unrelated gibberish (xyzabc123) while providing helpful related searches", () => {
    const { results, relatedSearches } = rankAndFilterProjects(SAMPLE_CATALOG, "xyzabc123");
    expect(results).toHaveLength(0);
    expect(relatedSearches.length).toBeGreaterThan(0);
  });

  it("builds structured suggestions from actual catalog data for 'ai' and 'web'", () => {
    const categories = DEFAULT_CATEGORIES.map((c) => ({ name: c.name, slug: c.slug }));
    const technologies = DEFAULT_TECHNOLOGIES.map((t) => ({ name: t.name, slug: t.slug }));

    const aiSug = buildCatalogSuggestions({
      query: "ai",
      projects: SAMPLE_CATALOG,
      categories,
      technologies,
    });
    expect(aiSug.suggestions).toContain("Artificial Intelligence");
    expect(aiSug.suggestions).toContain("Machine Learning");
    expect(aiSug.categories.some((c) => c.slug === "ai-machine-learning")).toBe(true);

    const webSug = buildCatalogSuggestions({
      query: "web",
      projects: SAMPLE_CATALOG,
      categories,
      technologies,
    });
    expect(webSug.suggestions).toContain("Web Development");
    expect(webSug.categories.some((c) => c.slug === "web-application")).toBe(true);
  });
});

describe("Recent Searches & Personalization", () => {
  beforeEach(() => {
    clearRecentSearches();
  });

  it("stores, deduplicates, removes, and caps recent searches without storing sensitive info", () => {
    expect(getRecentSearches()).toHaveLength(0);

    saveRecentSearch("AI ML");
    saveRecentSearch("Python projects");
    saveRecentSearch("React");
    expect(getRecentSearches().map((r) => r.query)).toEqual([
      "React",
      "Python projects",
      "AI ML",
    ]);

    // Sensitive strings (emails, long phone numbers, URLs) must be ignored
    saveRecentSearch("user@example.com");
    saveRecentSearch("9876543210");
    saveRecentSearch("https://example.com/secret");
    expect(getRecentSearches()).toHaveLength(3);

    // Removing one recent search works
    removeRecentSearch("Python projects");
    expect(getRecentSearches().map((r) => r.query)).toEqual(["React", "AI ML"]);

    // Cap at MAX_RECENT_SEARCHES
    for (let i = 1; i <= 12; i++) {
      saveRecentSearch(`Search Topic ${i}`);
    }
    expect(getRecentSearches().length).toBeLessThanOrEqual(MAX_RECENT_SEARCHES);

    // Clearing all works
    clearRecentSearches();
    expect(getRecentSearches()).toHaveLength(0);
  });

  it("influences suggestion ordering based on previous searches without hiding catalog suggestions", () => {
    saveRecentSearch("AI ML");
    const history = getRecentSearches();

    const baseSuggestions = [
      "Artificial Intelligence",
      "Machine Learning",
      "Deep Learning",
    ];
    const ranked = personalizeSuggestions(baseSuggestions, history, "ai");
    expect(ranked[0]).toBe("AI ML");
    expect(ranked).toContain("Artificial Intelligence");
    expect(ranked).toContain("Machine Learning");
    expect(ranked).toContain("Deep Learning");
  });
});
