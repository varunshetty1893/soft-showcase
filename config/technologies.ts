// config/technologies.ts
// Default technologies seeded into the database on first run.
// These are used in prisma/seed.ts.

export const DEFAULT_TECHNOLOGIES = [
  // Frontend
  { name: "React", slug: "react" },
  { name: "Next.js", slug: "nextjs" },
  { name: "Vue.js", slug: "vuejs" },
  { name: "Angular", slug: "angular" },
  { name: "Svelte", slug: "svelte" },
  { name: "TypeScript", slug: "typescript" },
  { name: "JavaScript", slug: "javascript" },
  { name: "Tailwind CSS", slug: "tailwind-css" },
  { name: "Bootstrap", slug: "bootstrap" },
  // Backend & AI / ML
  { name: "Node.js", slug: "nodejs" },
  { name: "Express.js", slug: "expressjs" },
  { name: "NestJS", slug: "nestjs" },
  { name: "Python", slug: "python" },
  { name: "Flask", slug: "flask" },
  { name: "Django", slug: "django" },
  { name: "FastAPI", slug: "fastapi" },
  { name: "TensorFlow", slug: "tensorflow" },
  { name: "Scikit-learn", slug: "scikit-learn" },
  { name: "PyTorch", slug: "pytorch" },
  { name: "PHP", slug: "php" },
  { name: "Laravel", slug: "laravel" },
  { name: "Ruby on Rails", slug: "ruby-on-rails" },
  { name: "Spring Boot", slug: "spring-boot" },
  // Databases
  { name: "PostgreSQL", slug: "postgresql" },
  { name: "MySQL", slug: "mysql" },
  { name: "MongoDB", slug: "mongodb" },
  { name: "SQLite", slug: "sqlite" },
  { name: "Redis", slug: "redis" },
  { name: "Supabase", slug: "supabase" },
  // Mobile
  { name: "React Native", slug: "react-native" },
  { name: "Flutter", slug: "flutter" },
  { name: "Expo", slug: "expo" },
  // Cloud & DevOps
  { name: "Vercel", slug: "vercel" },
  { name: "AWS", slug: "aws" },
  { name: "Docker", slug: "docker" },
  { name: "Firebase", slug: "firebase" },
  // ORM / Data
  { name: "Prisma", slug: "prisma" },
  { name: "Stripe", slug: "stripe" },
];
