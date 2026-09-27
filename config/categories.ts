// config/categories.ts
// Default categories seeded into the database on first run.
// These are used in prisma/seed.ts.

export const DEFAULT_CATEGORIES = [
  {
    name: "Web Application",
    slug: "web-application",
    description: "Full-stack web apps, dashboards, SaaS products",
    iconName: "Globe",
    sortOrder: 1,
  },
  {
    name: "Mobile App",
    slug: "mobile-app",
    description: "iOS and Android mobile applications",
    iconName: "Smartphone",
    sortOrder: 2,
  },
  {
    name: "E-Commerce",
    slug: "e-commerce",
    description: "Online stores, marketplaces, and shopping platforms",
    iconName: "ShoppingCart",
    sortOrder: 3,
  },
  {
    name: "Landing Page",
    slug: "landing-page",
    description: "Marketing and product landing pages",
    iconName: "Layout",
    sortOrder: 4,
  },
  {
    name: "Admin Panel",
    slug: "admin-panel",
    description: "CMS, CRM, and internal management tools",
    iconName: "Settings",
    sortOrder: 5,
  },
  {
    name: "API / Backend",
    slug: "api-backend",
    description: "REST APIs, microservices, and backend systems",
    iconName: "Server",
    sortOrder: 6,
  },
  {
    name: "AI / ML",
    slug: "ai-ml",
    description: "AI-powered tools, chatbots, and machine learning projects",
    iconName: "Brain",
    sortOrder: 7,
  },
  {
    name: "Other",
    slug: "other",
    description: "Projects that don't fit a specific category",
    iconName: "Package",
    sortOrder: 8,
  },
];
