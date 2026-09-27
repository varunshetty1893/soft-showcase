// types/project.ts
// Shared TypeScript types for project-related data.

import type {
  Project,
  ProjectImage,
  ProjectFeature,
  ProjectSpecification,
  ProjectFaq,
  ProjectTechnology,
  Technology,
  Category,
  ProjectProvider,
  ProjectStatus,
  PriceMode,
} from "@prisma/client";

// Full project with all relations — used on project detail pages
export type ProjectWithRelations = Project & {
  category: Category;
  provider: ProjectProvider;
  images: ProjectImage[];
  features: ProjectFeature[];
  specifications: ProjectSpecification[];
  faqs: ProjectFaq[];
  technologies: (ProjectTechnology & { technology: Technology })[];
};

// Lightweight project for cards/lists — avoids fetching heavy text fields
export type ProjectSummary = Pick<
  Project,
  | "id"
  | "title"
  | "slug"
  | "shortDescription"
  | "status"
  | "featured"
  | "priceMode"
  | "price"
  | "projectType"
  | "createdAt"
> & {
  category: Pick<Category, "id" | "name" | "slug">;
  provider: Pick<ProjectProvider, "id" | "displayName" | "avatarUrl">;
  primaryImage: Pick<ProjectImage, "url" | "altText"> | null;
};

// Form data for creating/editing a project
export type ProjectFormData = {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  status: ProjectStatus;
  featured: boolean;
  priceMode: PriceMode;
  price: number | null;
  demoUrl: string | null;
  projectType: string | null;
  whatsIncluded: string[];
  categoryId: string;
  providerId: string;
};

export type { ProjectStatus, PriceMode };
