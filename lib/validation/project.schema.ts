// lib/validation/project.schema.ts
// Zod validation schema for creating and editing projects.
// Price validation rules enforced per docs/13-database-design.md.

import { z } from "zod";

const PriceModeEnum = z.enum(["CONTACT", "FIXED", "STARTING_FROM", "FREE"]);
const ProjectStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

// Raw object shape — used for .partial() since ZodEffects (from .refine()) doesn't support it
const projectFields = {
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must be under 150 characters")
    .trim(),

  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(150, "Slug must be under 150 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase letters and numbers separated by hyphens"
    ),

  shortDescription: z
    .string()
    .min(10, "Short description must be at least 10 characters")
    .max(300, "Short description must be under 300 characters")
    .trim(),

  fullDescription: z
    .string()
    .min(50, "Full description must be at least 50 characters")
    .trim(),

  status: ProjectStatusEnum.default("DRAFT"),

  featured: z.boolean().default(false),

  priceMode: PriceModeEnum.default("CONTACT"),

  price: z.number().positive("Price must be a positive number").nullable(),

  demoUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .nullable(),

  projectType: z
    .string()
    .max(100, "Project type must be under 100 characters")
    .trim()
    .optional()
    .nullable(),

  whatsIncluded: z
    .array(z.string().min(1).max(200).trim())
    .max(20, "Maximum 20 items in what's included")
    .default([]),

  categoryId: z.string().min(1, "Please select a category"),

  providerId: z.string().min(1, "Please select a provider"),
};

// Full schema with price validation refinements (docs/13-database-design.md)
export const ProjectSchema = z
  .object(projectFields)
  .refine(
    (data) => {
      if (data.priceMode === "FIXED" || data.priceMode === "STARTING_FROM") {
        return data.price !== null && data.price > 0;
      }
      return true;
    },
    {
      message: "A price is required for FIXED and STARTING_FROM price modes",
      path: ["price"],
    }
  )
  .refine(
    (data) => {
      if (data.priceMode === "CONTACT" || data.priceMode === "FREE") {
        return data.price === null;
      }
      return true;
    },
    {
      message: "Price must be empty for CONTACT and FREE price modes",
      path: ["price"],
    }
  );

// Partial version for updates — built from raw fields so .partial() works
// (ZodEffects returned by .refine() does not support .partial())
export const ProjectUpdateSchema = z.object(projectFields).partial();

export type ProjectInput = z.infer<typeof ProjectSchema>;
export type ProjectUpdateInput = z.infer<typeof ProjectUpdateSchema>;
