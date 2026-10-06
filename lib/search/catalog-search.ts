// lib/search/catalog-search.ts
// Intelligent catalog search, normalization, synonym/concept expansion,
// typo-tolerant fuzzy matching, multi-field relevance scoring, and suggestion builder.

export interface SearchableProjectRecord {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription?: string | null;
  projectType?: string | null;
  whatsIncluded?: string[] | null;
  featured?: boolean;
  featuredOrder?: number;
  createdAt?: Date | string;
  category?: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
  } | null;
  provider?: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  } | null;
  technologies?: Array<{
    technology: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
  features?: Array<{
    feature: string;
  }>;
  specifications?: Array<{
    key: string;
    value: string;
  }>;
  [key: string]: any;
}

export interface ScoredProjectResult<T extends SearchableProjectRecord = SearchableProjectRecord> {
  project: T & { matchedTerms?: string[] };
  score: number;
  matchedTerms: string[];
  matchedConceptCount: number;
}

export interface ConceptGroup {
  id: string;
  label: string;
  canonicalQueries: string[];
  triggers: string[];
  relatedTerms: string[];
  relatedCategorySlugs: string[];
  relatedTechNames: string[];
}

/**
 * Generic catalog words that users often append to queries (e.g., "AI ML projects",
 * "Python web application", "student management system").
 * These should not cause a query to fail if other specific tokens are present,
 * though they still contribute when they match a category or title.
 */
const GENERIC_INTENT_WORDS = new Set([
  "project",
  "projects",
  "software",
  "app",
  "apps",
  "application",
  "applications",
  "system",
  "systems",
  "solution",
  "solutions",
  "platform",
  "platforms",
  "tool",
  "tools",
  "template",
  "templates",
  "code",
  "source",
  "build",
  "kit",
  "portal",
  "service",
]);

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "or",
  "the",
  "for",
  "with",
  "using",
  "in",
  "on",
  "of",
  "to",
  "by",
  "from",
  "at",
  "is",
  "are",
  "based",
]);

/**
 * Common abbreviations & shorthand expansions.
 */
export const ABBREVIATION_MAP: Record<string, string[]> = {
  ai: ["artificial intelligence", "machine learning", "deep learning", "generative ai", "llm", "smart"],
  ml: ["machine learning", "artificial intelligence", "deep learning", "data science", "python", "scikit-learn", "tensorflow"],
  dl: ["deep learning", "neural network", "machine learning", "artificial intelligence"],
  nlp: ["natural language processing", "artificial intelligence", "llm", "text analysis", "chatbot"],
  cv: ["computer vision", "image recognition", "ocr", "machine learning"],
  llm: ["large language model", "generative ai", "artificial intelligence", "gemini", "openai", "gpt"],
  genai: ["generative ai", "artificial intelligence", "llm", "gemini"],
  js: ["javascript", "nodejs", "react", "nextjs", "frontend", "web"],
  ts: ["typescript", "javascript", "nextjs", "react"],
  py: ["python", "flask", "django", "fastapi", "machine learning"],
  db: ["database", "postgresql", "mysql", "mongodb", "sqlite", "redis", "sql", "prisma"],
  dbms: ["database", "mysql", "postgresql", "sqlite", "mongodb", "sql"],
  rdbms: ["database", "postgresql", "mysql", "sqlite", "sql"],
  sql: ["database", "postgresql", "mysql", "sqlite"],
  nosql: ["mongodb", "redis", "firebase", "database"],
  pg: ["postgresql", "database", "sql"],
  postgres: ["postgresql", "database", "sql"],
  mongo: ["mongodb", "database", "nosql"],
  web: ["web application", "web development", "website", "frontend", "full stack", "react", "nextjs"],
  "web dev": ["web development", "web application", "website", "full stack", "frontend", "backend", "react", "nextjs"],
  webdev: ["web development", "web application", "website", "full stack", "react", "nextjs"],
  fullstack: ["full stack", "web application", "frontend", "backend", "nextjs", "react", "nodejs"],
  frontend: ["front end", "react", "nextjs", "vuejs", "angular", "tailwind css", "html", "css", "javascript", "ui"],
  backend: ["back end", "api", "nodejs", "express", "nestjs", "django", "fastapi", "flask", "spring boot", "laravel", "php"],
  mern: ["mongodb", "express", "react", "nodejs", "full stack", "javascript", "web application"],
  mean: ["mongodb", "express", "angular", "nodejs", "full stack", "web application"],
  ecom: ["e-commerce", "ecommerce", "online store", "marketplace", "shopping cart", "checkout", "stripe"],
  ecommerce: ["e-commerce", "online store", "marketplace", "shopping cart", "checkout", "stripe", "vendor"],
  pos: ["point of sale", "e-commerce", "billing", "inventory", "checkout"],
  cms: ["content management", "admin panel", "dashboard"],
  crm: ["customer relationship", "admin panel", "dashboard", "management"],
  erp: ["enterprise", "admin panel", "management", "inventory", "billing"],
  lms: ["learning management", "education", "student", "academic", "course"],
  hms: ["hospital management", "healthcare", "medical", "clinic", "patient"],
  hrms: ["human resource", "employee", "payroll", "attendance", "admin panel"],
  auth: ["authentication", "oauth", "security", "login", "jwt"],
  k8s: ["kubernetes", "docker", "devops", "cloud"],
  ui: ["user interface", "frontend", "design", "tailwind css", "landing page"],
  ux: ["user experience", "frontend", "design", "interactive"],
};

/**
 * Maintainable domain concept groups for Soft Showcase.
 * Connects related concepts, technologies, and categories so intent-based searches work naturally.
 */
export const SEARCH_CONCEPT_GROUPS: ConceptGroup[] = [
  {
    id: "ai-ml",
    label: "AI & Machine Learning",
    canonicalQueries: [
      "Artificial Intelligence",
      "Machine Learning",
      "AI & ML",
      "Deep Learning",
      "Computer Vision",
      "Natural Language Processing",
      "Python Machine Learning",
    ],
    triggers: [
      "ai",
      "ml",
      "aiml",
      "ai ml",
      "artificial intelligence",
      "machine learning",
      "deep learning",
      "neural network",
      "neural networks",
      "computer vision",
      "nlp",
      "natural language processing",
      "generative ai",
      "genai",
      "llm",
      "large language model",
      "data science",
      "tensorflow",
      "scikit-learn",
      "scikit learn",
      "sklearn",
      "pytorch",
      "gemini",
      "ocr",
      "recommendation engine",
      "smart",
      "intelligent",
    ],
    relatedTerms: [
      "artificial intelligence",
      "machine learning",
      "deep learning",
      "neural network",
      "computer vision",
      "nlp",
      "natural language processing",
      "generative ai",
      "llm",
      "data science",
      "python",
      "tensorflow",
      "scikit-learn",
      "pytorch",
      "gemini",
      "ocr",
      "document parsing",
      "clinical",
      "recommendation",
      "smart",
      "intelligent",
      "analytics",
      "ai",
      "ml",
    ],
    relatedCategorySlugs: ["ai-machine-learning", "ai-ml"],
    relatedTechNames: ["Python", "Flask", "FastAPI", "Django", "TensorFlow", "Scikit-learn", "PyTorch", "Next.js"],
  },
  {
    id: "web-development",
    label: "Web Development",
    canonicalQueries: [
      "Web Development",
      "Web Application",
      "Full Stack Development",
      "Frontend Development",
      "React",
      "Next.js",
    ],
    triggers: [
      "web",
      "web dev",
      "webdev",
      "web development",
      "web application",
      "webapp",
      "website",
      "frontend",
      "front end",
      "backend",
      "back end",
      "full stack",
      "fullstack",
      "mern",
      "mean",
      "react",
      "reactjs",
      "next.js",
      "nextjs",
      "next js",
      "node.js",
      "nodejs",
      "node js",
      "express",
      "express.js",
      "expressjs",
      "html",
      "html5",
      "css",
      "css3",
      "javascript",
      "js",
      "typescript",
      "ts",
      "tailwind",
      "tailwind css",
      "vue",
      "vuejs",
      "angular",
      "svelte",
    ],
    relatedTerms: [
      "web development",
      "web application",
      "website",
      "frontend",
      "backend",
      "full stack",
      "full-stack",
      "react",
      "next.js",
      "nextjs",
      "node.js",
      "nodejs",
      "express",
      "html",
      "html5",
      "css",
      "css3",
      "javascript",
      "typescript",
      "tailwind",
      "dashboard",
      "saas",
      "storefront",
      "responsive",
    ],
    relatedCategorySlugs: ["web-application", "landing-page", "api-backend"],
    relatedTechNames: [
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "Tailwind CSS",
      "Node.js",
      "Express.js",
      "Vue.js",
      "Angular",
      "Svelte",
      "Bootstrap",
    ],
  },
  {
    id: "python",
    label: "Python Ecosystem",
    canonicalQueries: [
      "Python",
      "Python Projects",
      "Flask",
      "Django",
      "FastAPI",
      "Python Machine Learning",
      "Data Science",
    ],
    triggers: [
      "python",
      "py",
      "flask",
      "django",
      "fastapi",
      "jinja",
      "jinja2",
      "pandas",
      "numpy",
      "automation",
    ],
    relatedTerms: [
      "python",
      "flask",
      "django",
      "fastapi",
      "data science",
      "machine learning",
      "automation",
      "sqlite",
      "jinja2",
      "recommendation",
      "ai",
      "ml",
    ],
    relatedCategorySlugs: ["ai-machine-learning", "web-application", "api-backend"],
    relatedTechNames: ["Python", "Flask", "Django", "FastAPI", "SQLite", "PostgreSQL"],
  },
  {
    id: "database",
    label: "Database & Storage",
    canonicalQueries: [
      "Database",
      "PostgreSQL",
      "MySQL",
      "MongoDB",
      "SQLite",
      "SQL Projects",
      "Prisma",
    ],
    triggers: [
      "database",
      "databases",
      "db",
      "dbms",
      "rdbms",
      "mysql",
      "mysqli",
      "mariadb",
      "postgresql",
      "postgres",
      "pg",
      "mongodb",
      "mongo",
      "sqlite",
      "redis",
      "supabase",
      "firebase",
      "sql",
      "nosql",
      "prisma",
    ],
    relatedTerms: [
      "database",
      "dbms",
      "mysql",
      "mysqli",
      "mariadb",
      "postgresql",
      "mongodb",
      "sqlite",
      "redis",
      "supabase",
      "firebase",
      "sql",
      "nosql",
      "prisma",
      "schema",
      "orm",
    ],
    relatedCategorySlugs: ["api-backend", "web-application", "admin-panel"],
    relatedTechNames: ["PostgreSQL", "MySQL", "MongoDB", "SQLite", "Redis", "Supabase", "Firebase", "Prisma"],
  },
  {
    id: "ecommerce",
    label: "E-Commerce & Marketplaces",
    canonicalQueries: [
      "E-Commerce",
      "Multi-Vendor Marketplace",
      "Online Store",
      "Shopping Cart & Checkout",
      "Stripe Integration",
    ],
    triggers: [
      "ecommerce",
      "e-commerce",
      "e commerce",
      "ecom",
      "store",
      "online store",
      "shop",
      "shopping",
      "shopping cart",
      "cart",
      "checkout",
      "marketplace",
      "multi-vendor",
      "multivendor",
      "vendor",
      "stripe",
      "payment",
      "inventory",
      "order tracking",
      "pos",
      "agri",
      "farmer",
    ],
    relatedTerms: [
      "e-commerce",
      "ecommerce",
      "marketplace",
      "storefront",
      "store",
      "shopping cart",
      "checkout",
      "stripe",
      "vendor",
      "multi-vendor",
      "inventory",
      "order",
      "payment",
      "catalog",
    ],
    relatedCategorySlugs: ["e-commerce", "web-application"],
    relatedTechNames: ["Stripe", "Next.js", "React", "PostgreSQL", "MySQL"],
  },
  {
    id: "mobile",
    label: "Mobile Applications",
    canonicalQueries: [
      "Mobile App",
      "React Native",
      "Flutter",
      "Android & iOS App",
      "Expo Mobile App",
    ],
    triggers: [
      "mobile",
      "mobile app",
      "android",
      "ios",
      "iphone",
      "react native",
      "flutter",
      "expo",
      "cross-platform",
      "cross platform",
    ],
    relatedTerms: [
      "mobile",
      "mobile app",
      "android",
      "ios",
      "react native",
      "flutter",
      "expo",
      "cross-platform",
    ],
    relatedCategorySlugs: ["mobile-app"],
    relatedTechNames: ["React Native", "Flutter", "Expo"],
  },
  {
    id: "management-admin",
    label: "Admin Panels & Management Systems",
    canonicalQueries: [
      "Admin Panel",
      "Student Management System",
      "Hospital & Healthcare Management",
      "CRM & Analytics Dashboard",
      "Inventory Management",
    ],
    triggers: [
      "admin",
      "admin panel",
      "dashboard",
      "management",
      "student",
      "student management",
      "academic",
      "college",
      "school",
      "university",
      "education",
      "lms",
      "hospital",
      "healthcare",
      "medical",
      "clinic",
      "patient",
      "hms",
      "cms",
      "crm",
      "erp",
      "hr",
      "hrms",
      "employee",
      "attendance",
      "fitness",
      "diet",
      "health",
    ],
    relatedTerms: [
      "admin",
      "admin panel",
      "dashboard",
      "management",
      "analytics",
      "user management",
      "control panel",
      "medical",
      "healthcare",
      "patient",
      "clinical",
      "fitness",
      "diet",
      "health",
      "inventory",
      "order tracking",
      "audit",
    ],
    relatedCategorySlugs: ["admin-panel", "web-application", "ai-machine-learning"],
    relatedTechNames: ["React", "Next.js", "PostgreSQL", "MySQL", "SQLite", "Python", "Tailwind CSS"],
  },
  {
    id: "portfolio-landing",
    label: "Landing Pages & Developer Portfolios",
    canonicalQueries: [
      "Landing Page",
      "Developer Portfolio",
      "3D Interactive Website",
      "Modern Portfolio",
    ],
    triggers: [
      "landing",
      "landing page",
      "portfolio",
      "developer portfolio",
      "3d",
      "three.js",
      "threejs",
      "interactive",
      "resume",
      "personal website",
      "marketing page",
    ],
    relatedTerms: [
      "landing page",
      "portfolio",
      "developer",
      "3d",
      "interactive",
      "animation",
      "responsive",
      "resume",
      "showcase",
    ],
    relatedCategorySlugs: ["landing-page", "web-application"],
    relatedTechNames: ["React", "Next.js", "Tailwind CSS", "TypeScript", "JavaScript"],
  },
];

/**
 * Known canonical terms used for typo correction / fuzzy matching.
 */
const CANONICAL_VOCABULARY: Array<{ term: string; display: string }> = [
  { term: "python", display: "Python" },
  { term: "javascript", display: "JavaScript" },
  { term: "typescript", display: "TypeScript" },
  { term: "react", display: "React" },
  { term: "nextjs", display: "Next.js" },
  { term: "nodejs", display: "Node.js" },
  { term: "expressjs", display: "Express.js" },
  { term: "vuejs", display: "Vue.js" },
  { term: "angular", display: "Angular" },
  { term: "svelte", display: "Svelte" },
  { term: "tailwind", display: "Tailwind CSS" },
  { term: "bootstrap", display: "Bootstrap" },
  { term: "django", display: "Django" },
  { term: "flask", display: "Flask" },
  { term: "fastapi", display: "FastAPI" },
  { term: "laravel", display: "Laravel" },
  { term: "postgresql", display: "PostgreSQL" },
  { term: "postgres", display: "PostgreSQL" },
  { term: "mysql", display: "MySQL" },
  { term: "mongodb", display: "MongoDB" },
  { term: "sqlite", display: "SQLite" },
  { term: "redis", display: "Redis" },
  { term: "supabase", display: "Supabase" },
  { term: "firebase", display: "Firebase" },
  { term: "prisma", display: "Prisma" },
  { term: "stripe", display: "Stripe" },
  { term: "flutter", display: "Flutter" },
  { term: "docker", display: "Docker" },
  { term: "kubernetes", display: "Kubernetes" },
  { term: "tensorflow", display: "TensorFlow" },
  { term: "pytorch", display: "PyTorch" },
  { term: "scikit-learn", display: "Scikit-learn" },
  { term: "machine", display: "Machine Learning" },
  { term: "learning", display: "Machine Learning" },
  { term: "artificial", display: "Artificial Intelligence" },
  { term: "intelligence", display: "Artificial Intelligence" },
  { term: "ecommerce", display: "E-Commerce" },
  { term: "marketplace", display: "Marketplace" },
  { term: "management", display: "Management" },
  { term: "dashboard", display: "Dashboard" },
  { term: "portfolio", display: "Portfolio" },
  { term: "healthcare", display: "Healthcare" },
  { term: "medical", display: "Medical" },
  { term: "fitness", display: "Fitness" },
  { term: "student", display: "Student Management" },
  { term: "database", display: "Database" },
  { term: "application", display: "Web Application" },
  { term: "development", display: "Web Development" },
  { term: "frontend", display: "Frontend" },
  { term: "backend", display: "Backend" },
  { term: "fullstack", display: "Full Stack" },
];

/**
 * Normalizes text for search comparisons:
 * - lowercases
 * - normalizes compound tech terms (e.g., Next.js, Node.js, E-Commerce, Full-Stack)
 * - strips punctuation to spaces
 * - collapses multiple spaces
 */
export function normalizeSearchText(input: string): string {
  if (!input) return "";
  return input
    .toLowerCase()
    .replace(/next\.js/g, "nextjs next js")
    .replace(/node\.js/g, "nodejs node js")
    .replace(/vue\.js/g, "vuejs vue js")
    .replace(/express\.js/g, "expressjs express js")
    .replace(/three\.js/g, "threejs three js")
    .replace(/e-commerce/g, "ecommerce e commerce")
    .replace(/full-stack/g, "fullstack full stack")
    .replace(/multi-vendor/g, "multivendor multi vendor")
    .replace(/cross-platform/g, "crossplatform cross platform")
    .replace(/scikit-learn/g, "scikitlearn scikit learn")
    .replace(/real-time/g, "realtime real time")
    .replace(/[\u2010-\u2015—–\-_/.,:;!?()[\]{}"'`~+#*&|<>]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Simple singular/stemmer helper for English catalog words.
 */
export function stemWord(word: string): string {
  const w = word.toLowerCase().trim();
  if (w.length <= 3) return w;
  if (w === "nextjs" || w === "nodejs" || w === "vuejs" || w === "expressjs" || w === "redis" || w === "serverless") {
    return w;
  }
  if (w.endsWith("ies") && w.length > 4) {
    return w.slice(0, -3) + "y";
  }
  if (w.endsWith("es") && (w.endsWith("ches") || w.endsWith("shes") || w.endsWith("xes") || w.endsWith("sses"))) {
    return w.slice(0, -2);
  }
  if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us") && !w.endsWith("is")) {
    return w.slice(0, -1);
  }
  return w;
}

/**
 * Standard Levenshtein edit distance between two strings (with transposition awareness / Damerau-Levenshtein).
 */
export function editDistance(a: string, b: string): number {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  if (s1 === s2) return 0;
  const len1 = s1.length;
  const len2 = s2.length;
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  if (Math.abs(len1 - len2) > 3) return Math.abs(len1 - len2);

  const dp: number[][] = Array.from({ length: len1 + 1 }, () => new Array(len2 + 1).fill(0));
  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
      // Adjacent transposition (e.g. "pyhton" -> "python")
      if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + cost);
      }
    }
  }
  return dp[len1][len2];
}

/**
 * Checks whether `token` is a close typo / fuzzy match for `candidateWord`.
 * Conservative threshold so unrelated words (e.g. "xyzabc123") never match.
 */
export function isFuzzyWordMatch(token: string, candidateWord: string): boolean {
  const t = token.toLowerCase().trim();
  const c = candidateWord.toLowerCase().trim();
  if (t.length < 4 || c.length < 4) return false;
  if (t === c) return true;

  // Avoid matching tokens containing numbers like "xyzabc123" against plain words
  if (/\d/.test(t) !== /\d/.test(c)) return false;

  // Prefix match for 5+ char tokens (e.g. "postgre" -> "postgresql", "javascrip" -> "javascript")
  if (t.length >= 5 && c.startsWith(t)) return true;

  // Must share first letter or first two letters (transposed)
  const sameStart =
    t[0] === c[0] ||
    (t.length >= 2 && c.length >= 2 && t[0] === c[1] && t[1] === c[0]);
  if (!sameStart) return false;

  const maxLen = Math.max(t.length, c.length);
  const maxAllowedDist = maxLen <= 5 ? 1 : 2;
  if (Math.abs(t.length - c.length) > maxAllowedDist) return false;

  const dist = editDistance(t, c);
  if (dist > maxAllowedDist) return false;

  const similarity = 1 - dist / maxLen;
  return similarity >= 0.72;
}

/**
 * Resolves a possibly misspelled token against canonical vocabulary.
 */
export function resolveFuzzyCanonical(token: string): { term: string; display: string } | null {
  const t = token.toLowerCase().trim();
  if (t.length < 4) return null;

  // Exact match first
  const exact = CANONICAL_VOCABULARY.find((v) => v.term === t);
  if (exact) return exact;

  // Prefix match for 5+ chars (e.g., "postgre" -> "postgresql")
  if (t.length >= 5) {
    const prefix = CANONICAL_VOCABULARY.find((v) => v.term.startsWith(t));
    if (prefix) return prefix;
  }

  let best: { term: string; display: string; dist: number } | null = null;
  for (const item of CANONICAL_VOCABULARY) {
    if (isFuzzyWordMatch(t, item.term)) {
      const dist = editDistance(t, item.term);
      if (!best || dist < best.dist) {
        best = { ...item, dist };
      }
    }
  }
  return best ? { term: best.term, display: best.display } : null;
}

export interface AnalyzedConcept {
  rawToken: string;
  stemmed: string;
  correctedToken: string;
  displayLabel: string;
  isGeneric: boolean;
  synonyms: string[];
  conceptGroupIds: string[];
  relatedCategorySlugs: string[];
  relatedTechNames: string[];
}

export interface QueryAnalysis {
  rawQuery: string;
  normalizedQuery: string;
  tokens: string[];
  coreConcepts: AnalyzedConcept[];
  allConcepts: AnalyzedConcept[];
  matchedGroups: ConceptGroup[];
  expandedTerms: string[];
  correctedQuery: string | null;
}

/**
 * Analyzes a raw search string into normalized tokens, typo corrections,
 * synonym sets, and concept groups.
 */
export function analyzeSearchQuery(rawQuery: string): QueryAnalysis {
  const trimmed = (rawQuery || "").trim();
  const normalizedQuery = normalizeSearchText(trimmed);

  // Deduplicate tokens produced by compound normalization while preserving order
  const rawTokens = normalizedQuery
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !STOP_WORDS.has(t));

  // Filter out redundant sub-tokens if the compound token is already present (e.g. "nextjs" vs "next" + "js")
  const tokens: string[] = [];
  for (const tk of rawTokens) {
    if (!tokens.includes(tk)) {
      tokens.push(tk);
    }
  }

  const matchedGroupMap = new Map<string, ConceptGroup>();
  // Check full phrase against concept group triggers first
  for (const group of SEARCH_CONCEPT_GROUPS) {
    for (const trigger of group.triggers) {
      const normTrigger = normalizeSearchText(trigger);
      if (
        normalizedQuery === normTrigger ||
        (normTrigger.includes(" ") && normalizedQuery.includes(normTrigger))
      ) {
        matchedGroupMap.set(group.id, group);
      }
    }
  }

  // Check phrase-level abbreviation map (e.g. "web dev")
  const phraseExpansions: string[] = [];
  for (const [abbr, exp] of Object.entries(ABBREVIATION_MAP)) {
    if (normalizedQuery === abbr || (abbr.includes(" ") && normalizedQuery.includes(abbr))) {
      phraseExpansions.push(...exp);
    }
  }

  let anyCorrected = false;
  const correctedParts: string[] = [];

  const allConcepts: AnalyzedConcept[] = tokens.map((token) => {
    const stemmed = stemWord(token);
    const fuzzyResolved = resolveFuzzyCanonical(token) || resolveFuzzyCanonical(stemmed);
    const correctedToken = fuzzyResolved ? fuzzyResolved.term : token;
    if (fuzzyResolved && fuzzyResolved.term !== token && fuzzyResolved.term !== stemmed) {
      anyCorrected = true;
    }
    correctedParts.push(fuzzyResolved ? fuzzyResolved.display : token);

    const synonymSet = new Set<string>([
      token,
      stemmed,
      correctedToken,
      stemWord(correctedToken),
      ...phraseExpansions,
    ]);

    // Direct abbreviation lookup
    for (const key of [token, stemmed, correctedToken]) {
      if (ABBREVIATION_MAP[key]) {
        for (const s of ABBREVIATION_MAP[key]) {
          synonymSet.add(s.toLowerCase());
        }
      }
    }

    const conceptGroupIds: string[] = [];
    const relatedCategorySlugs = new Set<string>();
    const relatedTechNames = new Set<string>();

    for (const group of SEARCH_CONCEPT_GROUPS) {
      const matchesGroup = group.triggers.some((tr) => {
        const nt = tr.toLowerCase();
        return nt === token || nt === stemmed || nt === correctedToken;
      });
      if (matchesGroup) {
        conceptGroupIds.push(group.id);
        matchedGroupMap.set(group.id, group);
        for (const rt of group.relatedTerms) synonymSet.add(rt.toLowerCase());
        for (const cs of group.relatedCategorySlugs) relatedCategorySlugs.add(cs);
        for (const tn of group.relatedTechNames) relatedTechNames.add(tn);
      }
    }

    const isGeneric = GENERIC_INTENT_WORDS.has(token) || GENERIC_INTENT_WORDS.has(stemmed);

    return {
      rawToken: token,
      stemmed,
      correctedToken,
      displayLabel: fuzzyResolved?.display || token,
      isGeneric,
      synonyms: Array.from(synonymSet),
      conceptGroupIds,
      relatedCategorySlugs: Array.from(relatedCategorySlugs),
      relatedTechNames: Array.from(relatedTechNames),
    };
  });

  // Also include any phrase-matched groups into concepts if needed
  for (const group of matchedGroupMap.values()) {
    for (const concept of allConcepts) {
      if (!concept.conceptGroupIds.includes(group.id)) {
        // Attach phrase group to non-generic concepts
        if (!concept.isGeneric) {
          concept.conceptGroupIds.push(group.id);
          for (const rt of group.relatedTerms) {
            if (!concept.synonyms.includes(rt.toLowerCase())) {
              concept.synonyms.push(rt.toLowerCase());
            }
          }
          for (const cs of group.relatedCategorySlugs) {
            if (!concept.relatedCategorySlugs.includes(cs)) {
              concept.relatedCategorySlugs.push(cs);
            }
          }
          for (const tn of group.relatedTechNames) {
            if (!concept.relatedTechNames.includes(tn)) {
              concept.relatedTechNames.push(tn);
            }
          }
        }
      }
    }
  }

  const nonGeneric = allConcepts.filter((c) => !c.isGeneric);
  const coreConcepts = nonGeneric.length > 0 ? nonGeneric : allConcepts;

  const expandedTermSet = new Set<string>();
  for (const c of coreConcepts) {
    for (const s of c.synonyms) {
      expandedTermSet.add(s);
    }
  }

  return {
    rawQuery: trimmed,
    normalizedQuery,
    tokens,
    coreConcepts,
    allConcepts,
    matchedGroups: Array.from(matchedGroupMap.values()),
    expandedTerms: Array.from(expandedTermSet),
    correctedQuery: anyCorrected ? correctedParts.join(" ") : null,
  };
}

/**
 * Checks if a target text contains a phrase or word boundary match.
 */
function textContainsTerm(normalizedTarget: string, targetWords: string[], term: string): "exact-word" | "partial" | null {
  const normTerm = normalizeSearchText(term);
  if (!normTerm) return null;

  if (normTerm.includes(" ")) {
    if (normalizedTarget.includes(normTerm)) return "exact-word";
    return null;
  }

  const stemTerm = stemWord(normTerm);
  for (const w of targetWords) {
    if (w === normTerm || stemWord(w) === stemTerm) {
      return "exact-word";
    }
  }

  if (normTerm.length >= 3) {
    for (const w of targetWords) {
      if (w.startsWith(normTerm) || (stemTerm.length >= 4 && w.startsWith(stemTerm))) {
        return "partial";
      }
    }
  }

  return null;
}

/**
 * Scores a single project against a QueryAnalysis using multi-field relevance weights:
 * - Exact title match:             +100
 * - Title contains query:          +70
 * - Exact category match:          +60
 * - Exact tech/tag match:          +55
 * - Related tech/tag match:        +45
 * - Description match:             +35
 * - Feature/specification match:   +25
 * - Partial word match:            +20
 * - Synonym/related-term match:    +15
 */
export function scoreProjectRelevance<T extends SearchableProjectRecord>(
  project: T,
  analysis: QueryAnalysis
): ScoredProjectResult<T> {
  if (!analysis.rawQuery || analysis.coreConcepts.length === 0) {
    return {
      project: { ...project, matchedTerms: [] },
      score: 0,
      matchedTerms: [],
      matchedConceptCount: 0,
    };
  }

  const titleRaw = project.title || "";
  const titleNorm = normalizeSearchText(titleRaw);
  const titleWords = titleNorm.split(" ").filter(Boolean);

  const slugNorm = normalizeSearchText(project.slug || "");
  const projectTypeNorm = normalizeSearchText(project.projectType || "");
  const projectTypeWords = projectTypeNorm.split(" ").filter(Boolean);

  const categoryName = project.category?.name || "";
  const categorySlug = project.category?.slug || "";
  const categoryNorm = normalizeSearchText(`${categoryName} ${categorySlug} ${project.category?.description || ""}`);
  const categoryWords = categoryNorm.split(" ").filter(Boolean);

  const techItems = (project.technologies || []).map((t) => ({
    name: t.technology.name,
    slug: t.technology.slug,
    norm: normalizeSearchText(`${t.technology.name} ${t.technology.slug}`),
    words: normalizeSearchText(`${t.technology.name} ${t.technology.slug}`).split(" ").filter(Boolean),
  }));

  const shortDescNorm = normalizeSearchText(project.shortDescription || "");
  const fullDescNorm = normalizeSearchText(project.fullDescription || "");
  const descCombinedNorm = `${shortDescNorm} ${fullDescNorm}`.trim();
  const descWords = descCombinedNorm.split(" ").filter(Boolean);

  const featuresText = (project.features || []).map((f) => f.feature).join(" ");
  const specsText = (project.specifications || []).map((s) => `${s.key} ${s.value}`).join(" ");
  const includedText = (project.whatsIncluded || []).join(" ");
  const metaCombinedNorm = normalizeSearchText(`${featuresText} ${specsText} ${includedText} ${project.projectType || ""}`);
  const metaWords = metaCombinedNorm.split(" ").filter(Boolean);

  let score = 0;
  const matchedTermsSet = new Set<string>();
  const addMatchedLabel = (label: string) => {
    const clean = label.trim();
    if (clean && matchedTermsSet.size < 4) {
      matchedTermsSet.add(clean);
    }
  };

  // 1. Full query phrase checks against Title & Category
  const fullQueryNorm = analysis.normalizedQuery;
  if (titleNorm === fullQueryNorm || slugNorm === fullQueryNorm) {
    score += 100;
    addMatchedLabel(project.title);
  } else if (fullQueryNorm.length >= 3 && titleNorm.includes(fullQueryNorm)) {
    score += 70;
  }

  if (
    fullQueryNorm.length >= 2 &&
    (normalizeSearchText(categoryName) === fullQueryNorm ||
      normalizeSearchText(categorySlug) === fullQueryNorm)
  ) {
    score += 60;
    if (categoryName) addMatchedLabel(categoryName);
  }

  // 2. Evaluate each core concept token
  let matchedConceptCount = 0;

  for (const concept of analysis.coreConcepts) {
    let conceptScore = 0;
    const directCandidates = Array.from(
      new Set([concept.rawToken, concept.stemmed, concept.correctedToken, stemWord(concept.correctedToken)])
    );

    // 2a. Title & ProjectType match (Highest)
    let matchedTitle = false;
    for (const cand of directCandidates) {
      const m = textContainsTerm(titleNorm, titleWords, cand) || textContainsTerm(projectTypeNorm, projectTypeWords, cand);
      if (m === "exact-word") {
        conceptScore = Math.max(conceptScore, 70);
        matchedTitle = true;
        addMatchedLabel(concept.displayLabel.length <= 3 ? concept.displayLabel.toUpperCase() : capitalizeWords(concept.displayLabel));
        break;
      } else if (m === "partial") {
        conceptScore = Math.max(conceptScore, 35);
        matchedTitle = true;
        addMatchedLabel(capitalizeWords(concept.displayLabel));
      }
    }

    // Fuzzy check on title words if not directly matched
    if (!matchedTitle && concept.rawToken.length >= 4) {
      for (const tw of titleWords) {
        if (isFuzzyWordMatch(concept.rawToken, tw)) {
          conceptScore = Math.max(conceptScore, 50);
          addMatchedLabel(capitalizeWords(tw));
          break;
        }
      }
    }

    // 2b. Category match (High: +60 exact, +45 related)
    for (const cand of directCandidates) {
      const m = textContainsTerm(categoryNorm, categoryWords, cand);
      if (m === "exact-word") {
        conceptScore = Math.max(conceptScore, 60);
        if (categoryName) addMatchedLabel(categoryName);
        break;
      } else if (m === "partial") {
        conceptScore = Math.max(conceptScore, 35);
        if (categoryName) addMatchedLabel(categoryName);
      }
    }

    if (
      categorySlug &&
      concept.relatedCategorySlugs.some(
        (slug) => slug === categorySlug || (slug === "ai-machine-learning" && categorySlug === "ai-ml")
      )
    ) {
      conceptScore = Math.max(conceptScore, 45);
      if (categoryName) addMatchedLabel(categoryName);
    }

    // 2c. Technology / Tag match (High: +55 exact, +45 related)
    for (const tech of techItems) {
      let techMatched = false;
      for (const cand of directCandidates) {
        const m = textContainsTerm(tech.norm, tech.words, cand);
        if (m === "exact-word") {
          conceptScore = Math.max(conceptScore, 55);
          addMatchedLabel(tech.name);
          techMatched = true;
          break;
        } else if (m === "partial") {
          conceptScore = Math.max(conceptScore, 35);
          addMatchedLabel(tech.name);
          techMatched = true;
          break;
        }
      }
      if (!techMatched && concept.rawToken.length >= 4) {
        for (const tw of tech.words) {
          if (isFuzzyWordMatch(concept.rawToken, tw)) {
            conceptScore = Math.max(conceptScore, 48);
            addMatchedLabel(tech.name);
            techMatched = true;
            break;
          }
        }
      }
      if (
        !techMatched &&
        concept.relatedTechNames.some((rt) => rt.toLowerCase() === tech.name.toLowerCase())
      ) {
        conceptScore = Math.max(conceptScore, 45);
        addMatchedLabel(tech.name);
      }
    }

    // 2d. Description match (Medium: +35 exact, +20 partial)
    for (const cand of directCandidates) {
      const m = textContainsTerm(descCombinedNorm, descWords, cand);
      if (m === "exact-word") {
        conceptScore = Math.max(conceptScore, 35);
        addMatchedLabel( findCanonicalTechOrConceptLabel(cand) || capitalizeWords(concept.displayLabel) );
        break;
      } else if (m === "partial") {
        conceptScore = Math.max(conceptScore, 20);
        addMatchedLabel(capitalizeWords(concept.displayLabel));
      }
    }

    // 2e. Features / Specifications / Deliverables match (Medium: +25)
    for (const cand of directCandidates) {
      const m = textContainsTerm(metaCombinedNorm, metaWords, cand);
      if (m === "exact-word") {
        conceptScore = Math.max(conceptScore, 25);
        addMatchedLabel(findCanonicalTechOrConceptLabel(cand) || capitalizeWords(concept.displayLabel));
        break;
      } else if (m === "partial") {
        conceptScore = Math.max(conceptScore, 20);
      }
    }

    // Fuzzy check on description & specs words if still 0
    if (conceptScore === 0 && concept.rawToken.length >= 4) {
      const matchedDescWord = descWords.find((w) => isFuzzyWordMatch(concept.rawToken, w));
      if (matchedDescWord) {
        conceptScore = Math.max(conceptScore, 28);
        addMatchedLabel(findCanonicalTechOrConceptLabel(matchedDescWord) || capitalizeWords(matchedDescWord));
      } else {
        const matchedMetaWord = metaWords.find((w) => isFuzzyWordMatch(concept.rawToken, w));
        if (matchedMetaWord) {
          conceptScore = Math.max(conceptScore, 22);
          addMatchedLabel(findCanonicalTechOrConceptLabel(matchedMetaWord) || capitalizeWords(matchedMetaWord));
        }
      }
    }

    // 2f. Synonym / Related-Term match across Title, Category, Tech, Description, Specs (+45 in title/tech/cat, +15 in desc/specs)
    for (const syn of concept.synonyms) {
      if (directCandidates.includes(syn)) continue;
      const inTitle = textContainsTerm(titleNorm, titleWords, syn);
      const inType = textContainsTerm(projectTypeNorm, projectTypeWords, syn);
      const inCat = textContainsTerm(categoryNorm, categoryWords, syn);
      if (inTitle === "exact-word" || inType === "exact-word" || inCat === "exact-word") {
        conceptScore = Math.max(conceptScore, 45);
        addMatchedLabel(findCanonicalTechOrConceptLabel(syn) || capitalizeWords(syn));
        break;
      }
      const inDesc = textContainsTerm(descCombinedNorm, descWords, syn);
      const inMeta = textContainsTerm(metaCombinedNorm, metaWords, syn);
      if (inDesc === "exact-word" || inMeta === "exact-word") {
        conceptScore = Math.max(conceptScore, 15);
        addMatchedLabel(findCanonicalTechOrConceptLabel(syn) || capitalizeWords(syn));
      }
    }

    if (conceptScore > 0) {
      matchedConceptCount += 1;
      score += conceptScore;
    }
  }

  // 3. Multi-word concept synergy bonus:
  // Projects matching multiple distinct concepts in a multi-word query rank significantly higher.
  if (matchedConceptCount >= 2) {
    score += (matchedConceptCount - 1) * 25;
  }

  // 4. Secondary tie-breaker boost for featured & recency ONLY when the project is actually relevant
  if (score >= 15) {
    if (project.featured) {
      score += 2;
    }
    if (project.createdAt) {
      const createdTime = new Date(project.createdAt).getTime();
      if (!Number.isNaN(createdTime)) {
        const ageDays = Math.max(0, (Date.now() - createdTime) / (1000 * 60 * 60 * 24));
        if (ageDays < 90) {
          score += 1;
        }
      }
    }
  } else {
    score = 0;
  }

  const matchedTerms = Array.from(matchedTermsSet).slice(0, 3);

  return {
    project: {
      ...project,
      matchedTerms: score > 0 ? matchedTerms : [],
    },
    score,
    matchedTerms: score > 0 ? matchedTerms : [],
    matchedConceptCount,
  };
}

function capitalizeWords(str: string): string {
  return str
    .split(" ")
    .filter(Boolean)
    .map((w) => {
      if (w.toLowerCase() === "ai" || w.toLowerCase() === "ml" || w.toLowerCase() === "ui" || w.toLowerCase() === "ux" || w.toLowerCase() === "db" || w.toLowerCase() === "sql" || w.toLowerCase() === "api" || w.toLowerCase() === "ocr" || w.toLowerCase() === "llm" || w.toLowerCase() === "nlp") {
        return w.toUpperCase();
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

function findCanonicalTechOrConceptLabel(term: string): string | null {
  const norm = term.toLowerCase().trim();
  const found = CANONICAL_VOCABULARY.find((v) => v.term === norm);
  if (found) return found.display;
  if (norm === "ai" || norm === "ml" || norm === "nlp" || norm === "llm" || norm === "ocr" || norm === "sql" || norm === "api") {
    return norm.toUpperCase();
  }
  return null;
}

/**
 * Ranks and filters a list of candidate projects using the intelligent search engine.
 */
export function rankAndFilterProjects<T extends SearchableProjectRecord>(
  projects: T[],
  rawQuery: string
): {
  results: Array<T & { matchedTerms?: string[] }>;
  analysis: QueryAnalysis;
  relatedSearches: string[];
} {
  const analysis = analyzeSearchQuery(rawQuery);
  if (!analysis.rawQuery || analysis.coreConcepts.length === 0) {
    return {
      results: projects,
      analysis,
      relatedSearches: [],
    };
  }

  const scored = projects
    .map((project) => scoreProjectRelevance(project, analysis))
    .filter((item) => item.score >= 15);

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.matchedConceptCount !== a.matchedConceptCount) {
      return b.matchedConceptCount - a.matchedConceptCount;
    }
    if (Boolean(b.project.featured) !== Boolean(a.project.featured)) {
      return b.project.featured ? 1 : -1;
    }
    return 0;
  });

  const relatedSearches = getRelatedSearchSuggestions(analysis, projects);

  return {
    results: scored.map((s) => s.project),
    analysis,
    relatedSearches,
  };
}

/**
 * Generates related search phrases for the empty state or suggestion dropdown,
 * grounded in matched concept groups and actual catalog categories/technologies.
 */
export function getRelatedSearchSuggestions(
  analysis: QueryAnalysis,
  catalogProjects: SearchableProjectRecord[] = []
): string[] {
  const suggestions = new Set<string>();
  const lowerRaw = analysis.rawQuery.toLowerCase();

  // 1. If a typo was corrected, suggest the corrected query first
  if (analysis.correctedQuery && analysis.correctedQuery.toLowerCase() !== lowerRaw) {
    suggestions.add(analysis.correctedQuery);
  }

  // 2. From matched concept groups
  for (const group of analysis.matchedGroups) {
    for (const q of group.canonicalQueries) {
      if (q.toLowerCase() !== lowerRaw) {
        suggestions.add(q);
      }
      if (suggestions.size >= 6) break;
    }
  }

  // 3. Extract actual categories & technologies present in the catalog
  for (const p of catalogProjects) {
    if (p.category?.name && p.category.name.toLowerCase() !== lowerRaw && p.category.name !== "Other") {
      suggestions.add(p.category.name);
    }
    for (const t of p.technologies || []) {
      if (t.technology?.name && t.technology.name.toLowerCase() !== lowerRaw) {
        suggestions.add(t.technology.name);
      }
    }
    if (suggestions.size >= 8) break;
  }

  // 4. Fallback high-value catalog queries if still fewer than 5
  const fallbackQueries = [
    "Artificial Intelligence",
    "Machine Learning",
    "Web Application",
    "E-Commerce",
    "Python",
    "Next.js",
    "React",
    "PostgreSQL",
  ];
  for (const fq of fallbackQueries) {
    if (suggestions.size >= 6) break;
    if (fq.toLowerCase() !== lowerRaw) {
      suggestions.add(fq);
    }
  }

  return Array.from(suggestions).slice(0, 6);
}

export interface CatalogSuggestionResponse {
  query: string;
  suggestions: string[];
  technologies: Array<{ name: string; slug: string }>;
  categories: Array<{ name: string; slug: string }>;
  projects: Array<{ title: string; slug: string; categoryName?: string | null }>;
}

/**
 * Builds structured autocomplete suggestions from actual catalog data + domain concepts.
 */
export function buildCatalogSuggestions(params: {
  query: string;
  projects: SearchableProjectRecord[];
  categories: Array<{ name: string; slug: string }>;
  technologies: Array<{ name: string; slug: string }>;
}): CatalogSuggestionResponse {
  const { query, projects, categories, technologies } = params;
  const trimmed = (query || "").trim();

  // Collect technologies actually used by published projects first, then active technologies
  const usedTechMap = new Map<string, { name: string; slug: string; count: number }>();
  for (const p of projects) {
    for (const pt of p.technologies || []) {
      if (pt.technology?.slug) {
        const prev = usedTechMap.get(pt.technology.slug);
        usedTechMap.set(pt.technology.slug, {
          name: pt.technology.name,
          slug: pt.technology.slug,
          count: (prev?.count || 0) + 1,
        });
      }
    }
  }
  for (const t of technologies) {
    if (!usedTechMap.has(t.slug)) {
      usedTechMap.set(t.slug, { name: t.name, slug: t.slug, count: 0 });
    }
  }
  const allTechs = Array.from(usedTechMap.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  const validCategories = categories.filter((c) => c.slug !== "ai-ml" && c.slug !== "other");

  if (!trimmed) {
    const defaultSuggestions: string[] = [];
    for (const p of projects.slice(0, 3)) {
      defaultSuggestions.push(p.title);
    }
    for (const q of ["AI & Machine Learning", "Web Development", "Python Projects", "E-Commerce", "Full Stack"]) {
      if (!defaultSuggestions.includes(q)) defaultSuggestions.push(q);
    }
    return {
      query: "",
      suggestions: defaultSuggestions.slice(0, 5),
      technologies: allTechs.slice(0, 5).map(({ name, slug }) => ({ name, slug })),
      categories: validCategories.slice(0, 4),
      projects: projects.slice(0, 3).map((p) => ({
        title: p.title,
        slug: p.slug,
        categoryName: p.category?.name || null,
      })),
    };
  }

  const analysis = analyzeSearchQuery(trimmed);
  const normQuery = analysis.normalizedQuery;
  const suggestionSet = new Set<string>();

  // 1. Typo correction suggestion if applicable
  if (analysis.correctedQuery && analysis.correctedQuery.toLowerCase() !== trimmed.toLowerCase()) {
    suggestionSet.add(analysis.correctedQuery);
  }

  // 2. Concept group canonical suggestions matching the query
  for (const group of analysis.matchedGroups) {
    for (const cq of group.canonicalQueries) {
      suggestionSet.add(cq);
    }
  }

  // 3. Prefix/substring matches from concept group canonical queries
  for (const group of SEARCH_CONCEPT_GROUPS) {
    for (const cq of group.canonicalQueries) {
      if (normalizeSearchText(cq).includes(normQuery)) {
        suggestionSet.add(cq);
      }
    }
  }

  // 4. Ranked matching projects from the actual catalog
  const rankedProjects = rankAndFilterProjects(projects, trimmed).results;
  for (const rp of rankedProjects.slice(0, 4)) {
    suggestionSet.add(rp.title);
  }

  // 5. Matching technologies from actual catalog + concept groups
  const matchedTechs: Array<{ name: string; slug: string }> = [];
  const relatedTechNamesLower = new Set(
    analysis.coreConcepts.flatMap((c) => c.relatedTechNames.map((n) => n.toLowerCase()))
  );

  for (const tech of allTechs) {
    const techNorm = normalizeSearchText(`${tech.name} ${tech.slug}`);
    const techWords = techNorm.split(" ").filter(Boolean);
    const directMatch =
      techNorm.includes(normQuery) ||
      analysis.coreConcepts.some(
        (c) =>
          textContainsTerm(techNorm, techWords, c.rawToken) !== null ||
          textContainsTerm(techNorm, techWords, c.correctedToken) !== null ||
          isFuzzyWordMatch(c.rawToken, tech.name)
      );
    const relatedMatch = relatedTechNamesLower.has(tech.name.toLowerCase());

    if (directMatch || relatedMatch) {
      matchedTechs.push({ name: tech.name, slug: tech.slug });
      if (directMatch && suggestionSet.size < 8) {
        suggestionSet.add(tech.name);
      }
    }
  }

  // 6. Matching categories from actual catalog + concept groups
  const matchedCategories: Array<{ name: string; slug: string }> = [];
  const relatedCatSlugs = new Set(analysis.coreConcepts.flatMap((c) => c.relatedCategorySlugs));

  for (const cat of validCategories) {
    const catNorm = normalizeSearchText(`${cat.name} ${cat.slug}`);
    const catWords = catNorm.split(" ").filter(Boolean);
    const directMatch =
      catNorm.includes(normQuery) ||
      analysis.coreConcepts.some(
        (c) =>
          textContainsTerm(catNorm, catWords, c.rawToken) !== null ||
          textContainsTerm(catNorm, catWords, c.correctedToken) !== null
      );
    const relatedMatch = relatedCatSlugs.has(cat.slug);

    if (directMatch || relatedMatch) {
      matchedCategories.push({ name: cat.name, slug: cat.slug });
      if (directMatch && suggestionSet.size < 8) {
        suggestionSet.add(cat.name);
      }
    }
  }

  return {
    query: trimmed,
    suggestions: Array.from(suggestionSet).slice(0, 6),
    technologies: matchedTechs.slice(0, 5),
    categories: matchedCategories.slice(0, 4),
    projects: rankedProjects.slice(0, 3).map((p) => ({
      title: p.title,
      slug: p.slug,
      categoryName: p.category?.name || null,
    })),
  };
}
