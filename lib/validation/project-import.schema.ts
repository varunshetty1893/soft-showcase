// lib/validation/project-import.schema.ts
// Zod schema for validating AI-generated or manual project JSON imports.
// Source of truth: docs/22-project-import.md & docs/23-project-import-template.md

import { z } from "zod";

export const ImportProviderSchema = z.object({
  name: z.string().min(2, "Provider name must be at least 2 characters").max(100).trim(),
  email: z.string().email("Invalid provider email address").trim().toLowerCase(),
  whatsapp: z.string().max(25).trim().optional().or(z.literal("")).nullable(),
});

export const ImportFaqItemSchema = z.object({
  question: z.string().min(3, "Question must be at least 3 characters").max(500).trim(),
  answer: z.string().min(5, "Answer must be at least 5 characters").max(2000).trim(),
  sortOrder: z.number().int().min(0).optional(),
});

export const ImportFeatureItemSchema = z.object({
  feature: z.string().min(1).max(200).trim(),
  sortOrder: z.number().int().min(0).optional(),
});

export const ImportSpecItemSchema = z.object({
  key: z.string().min(1).max(100).trim(),
  value: z.string().min(1).max(500).trim(),
  sortOrder: z.number().int().min(0).optional(),
});

export const ProjectImportSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters").max(200).trim(),
    shortDescription: z
      .string()
      .min(10, "Short description must be at least 10 characters")
      .max(500)
      .trim(),
    fullDescription: z
      .string()
      .min(20, "Full description must be at least 20 characters")
      .trim(),

    category: z.string().min(1).max(100).trim().optional(),
    categorySlug: z.string().min(1).trim().optional(),

    projectType: z.string().max(100).trim().optional().nullable(),

    technologies: z.array(z.string().min(1).max(50).trim()).optional().default([]),
    technologySlugs: z.array(z.string().min(1).trim()).optional().default([]),

    features: z
      .union([
        z.array(z.string().min(1).max(200).trim()),
        z.array(ImportFeatureItemSchema),
      ])
      .optional()
      .default([]),

    specifications: z
      .union([
        z.record(z.string(), z.string()),
        z.array(ImportSpecItemSchema),
      ])
      .optional()
      .default({}),

    whatsIncluded: z
      .array(z.string().min(1).max(200).trim())
      .optional()
      .default([]),

    faq: z.array(ImportFaqItemSchema).optional().default([]),
    faqs: z.array(ImportFaqItemSchema).optional().default([]),

    priceMode: z
      .enum(["CONTACT", "FIXED", "STARTING_FROM", "FREE"])
      .default("CONTACT"),
    price: z.number().positive("Price must be a positive number").nullable().optional(),

    demoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),

    mainImage: z.string().url("Must be a valid image URL").optional().or(z.literal("")).nullable(),
    images: z
      .union([
        z.array(z.string().url("Must be a valid image URL")),
        z.array(z.object({ url: z.string().url(), altText: z.string().optional() })),
      ])
      .optional()
      .default([]),

    provider: ImportProviderSchema.optional(),
    providerEmail: z.string().email().optional(),
  })
  .refine(
    (data) => Boolean(data.category || data.categorySlug),
    {
      message: "Category (name or slug) is required",
      path: ["category"],
    }
  )
  .refine(
    (data) => Boolean(data.provider?.email || data.providerEmail),
    {
      message: "Provider email is required",
      path: ["provider"],
    }
  )
  .refine(
    (data) => {
      if (data.priceMode === "FIXED" || data.priceMode === "STARTING_FROM") {
        return typeof data.price === "number" && data.price > 0;
      }
      return data.price === null || data.price === undefined;
    },
    {
      message:
        "Price is required and must be positive when priceMode is FIXED or STARTING_FROM; price must be empty or null for CONTACT and FREE",
      path: ["price"],
    }
  );

export type ProjectImportInput = z.infer<typeof ProjectImportSchema>;

export const PartnerSolutionImportSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters").max(200).trim(),
    shortDescription: z
      .string()
      .min(10, "Short description must be at least 10 characters")
      .max(500)
      .trim(),
    fullDescription: z
      .string()
      .min(20, "Full description must be at least 20 characters")
      .trim(),

    category: z.string().min(1).max(100).trim().optional(),
    categorySlug: z.string().min(1).trim().optional(),

    projectType: z.string().max(100).trim().optional().nullable(),

    technologies: z.array(z.string().min(1).max(50).trim()).optional().default([]),
    technologySlugs: z.array(z.string().min(1).trim()).optional().default([]),

    features: z
      .union([
        z.array(z.string().min(1).max(200).trim()),
        z.array(ImportFeatureItemSchema),
      ])
      .optional()
      .default([]),

    specifications: z
      .union([
        z.record(z.string(), z.string()),
        z.array(ImportSpecItemSchema),
      ])
      .optional()
      .default({}),

    whatsIncluded: z
      .array(z.string().min(1).max(200).trim())
      .optional()
      .default([]),

    faq: z.array(ImportFaqItemSchema).optional().default([]),
    faqs: z.array(ImportFaqItemSchema).optional().default([]),

    priceMode: z
      .enum(["CONTACT", "FIXED", "STARTING_FROM", "FREE"])
      .default("CONTACT"),
    price: z.number().positive("Price must be a positive number").nullable().optional(),

    demoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")).nullable(),

    mainImage: z.string().url("Must be a valid image URL").optional().or(z.literal("")).nullable(),
    images: z
      .union([
        z.array(z.string().url("Must be a valid image URL")),
        z.array(z.object({ url: z.string().url(), altText: z.string().optional() })),
      ])
      .optional()
      .default([]),

    status: z.enum(["DRAFT", "PUBLISHED"]).optional().default("PUBLISHED"),
    featured: z.boolean().optional().default(false),

    // Optional provider field (if imported from admin template, it's safely ignored or used for contact details)
    provider: ImportProviderSchema.optional(),
    providerEmail: z.string().email().optional(),
  })
  .refine(
    (data) => Boolean(data.category || data.categorySlug),
    {
      message: "Category (name or slug) is required",
      path: ["category"],
    }
  )
  .refine(
    (data) => {
      if (data.priceMode === "FIXED" || data.priceMode === "STARTING_FROM") {
        return typeof data.price === "number" && data.price > 0;
      }
      return data.price === null || data.price === undefined;
    },
    {
      message:
        "Price is required and must be positive when priceMode is FIXED or STARTING_FROM; price must be empty or null for CONTACT and FREE",
      path: ["price"],
    }
  );

export type PartnerSolutionImportInput = z.infer<typeof PartnerSolutionImportSchema>;

/**
 * Normalized representation of the import ready for preview and database insertion.
 */
export interface NormalizedProjectImport {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  categoryName: string;
  categorySlug: string;
  projectType: string | null;
  technologies: string[];
  features: Array<{ feature: string; sortOrder: number }>;
  specifications: Array<{ key: string; value: string; sortOrder: number }>;
  whatsIncluded: string[];
  faqs: Array<{ question: string; answer: string; sortOrder: number }>;
  priceMode: "CONTACT" | "FIXED" | "STARTING_FROM" | "FREE";
  price: number | null;
  demoUrl: string | null;
  provider: {
    name: string;
    email: string;
    whatsapp: string | null;
  };
}
