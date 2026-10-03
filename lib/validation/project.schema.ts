// lib/validation/project.schema.ts
// Zod validation schema for creating and editing projects (including Phase 3 moderation & Phase 4 pricing offers).
// Source of truth: docs/13-database-design.md + Phase 4 pricing offer rules.

import { z } from "zod";
import {
  DEAL_TYPES,
  PRICE_QUALIFIERS,
  TIME_LIMITED_DEAL_TYPES,
  type DealTypeValue,
} from "@/lib/utils/pricing";

export const PriceModeEnum = z.enum(["CONTACT", "FIXED", "STARTING_FROM", "FREE"]);
export const ProjectStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const DealTypeEnum = z.enum(DEAL_TYPES);
export const PriceQualifierEnum = z.enum(PRICE_QUALIFIERS);

const nullableDateOrIso = z
  .union([z.date(), z.string(), z.null(), z.undefined()])
  .transform((val) => {
    if (!val) return null;
    if (val instanceof Date) return Number.isNaN(val.getTime()) ? null : val;
    const trimmed = val.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  });

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

  featuredOrder: z.number().int().min(0).default(0).optional(),

  priceMode: PriceModeEnum.default("CONTACT"),

  price: z.number().positive("Price must be a positive number").nullable(),

  originalPrice: z
    .number()
    .positive("Original price must be a positive number")
    .optional()
    .nullable(),

  priceQualifier: PriceQualifierEnum.default("NONE").optional(),

  dealType: DealTypeEnum.default("NONE").optional(),

  dealLabel: z
    .string()
    .trim()
    .max(24, "Custom offer label cannot exceed 24 characters")
    .optional()
    .nullable(),

  dealStartsAt: nullableDateOrIso.optional(),

  dealEndsAt: nullableDateOrIso.optional(),

  moderationNote: z.string().trim().max(1000).optional().nullable(),

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

  features: z
    .array(
      z.object({
        feature: z.string().trim().min(2).max(250),
        sortOrder: z.number().optional(),
      })
    )
    .max(25, "Maximum 25 features allowed")
    .optional(),

  specifications: z
    .array(
      z.object({
        key: z.string().trim().min(1).max(60),
        value: z.string().trim().min(1).max(250),
        sortOrder: z.number().optional(),
      })
    )
    .max(25, "Maximum 25 specifications allowed")
    .optional(),

  faqs: z
    .array(
      z.object({
        question: z.string().trim().min(3).max(250),
        answer: z.string().trim().min(3).max(1000),
        sortOrder: z.number().optional(),
      })
    )
    .max(20, "Maximum 20 FAQs allowed")
    .optional(),

  technologies: z
    .array(z.string().trim().max(60))
    .max(20, "Maximum 20 technologies allowed")
    .optional(),

  images: z
    .array(
      z.object({
        url: z
          .string()
          .url("Please provide a valid image URL")
          .max(2_000_000, "Image URL is too large"),
        storageKey: z.string().max(250).optional(),
        altText: z.string().max(200).optional(),
        isPrimary: z.boolean().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .max(15, "Maximum 15 images allowed")
    .optional(),

  categoryId: z.string().min(1, "Please select a category"),

  providerId: z.string().min(1, "Please select a provider"),
};

function applyPricingOfferSuperRefine(
  data: {
    priceMode?: "CONTACT" | "FIXED" | "STARTING_FROM" | "FREE";
    price?: number | null;
    originalPrice?: number | null;
    dealType?: DealTypeValue;
    dealLabel?: string | null;
    dealStartsAt?: Date | null;
    dealEndsAt?: Date | null;
  },
  ctx: z.RefinementCtx,
  isPartial = false
) {
  const mode = data.priceMode;
  const dealType = (data.dealType || "NONE") as DealTypeValue;

  if (!isPartial) {
    if (mode === "FIXED" || mode === "STARTING_FROM") {
      if (data.price === null || data.price === undefined || data.price <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A price is required for FIXED and STARTING_FROM price modes",
          path: ["price"],
        });
      }
    }

    if (mode === "CONTACT" || mode === "FREE") {
      if (data.price !== null && data.price !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Price must be empty for CONTACT and FREE price modes",
          path: ["price"],
        });
      }
    }
  } else {
    if (
      (mode === "FIXED" || mode === "STARTING_FROM") &&
      data.price !== undefined &&
      (data.price === null || data.price <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A price is required for FIXED and STARTING_FROM price modes",
        path: ["price"],
      });
    }
    if (
      (mode === "CONTACT" || mode === "FREE") &&
      data.price !== undefined &&
      data.price !== null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price must be null for CONTACT and FREE price modes",
        path: ["price"],
      });
    }
  }

  // Original price validation
  if (data.originalPrice !== null && data.originalPrice !== undefined) {
    if (mode && mode !== "FIXED") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Original price must be strictly greater than selling price and is only allowed for FIXED price mode",
        path: ["originalPrice"],
      });
    } else if (
      data.price !== undefined &&
      data.price !== null &&
      data.originalPrice <= data.price
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Original price must be strictly greater than selling price and is only allowed for FIXED price mode",
        path: ["originalPrice"],
      });
    }
  }

  // Promotional Offer / Deal validation (Phase 4)
  if (dealType !== "NONE") {
    if (mode && mode !== "FIXED") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Offers are only allowed when priceMode is FIXED",
        path: ["dealType"],
      });
    }

    if (
      !isPartial &&
      (data.originalPrice === null ||
        data.originalPrice === undefined ||
        data.price === null ||
        data.price === undefined ||
        data.originalPrice <= data.price)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Regular price (originalPrice) must be greater than selling price when an offer is set",
        path: ["originalPrice"],
      });
    }

    if (dealType === "CUSTOM") {
      const cleanLabel = (data.dealLabel || "").trim();
      if (!cleanLabel) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Custom deal label is required when dealType is CUSTOM",
          path: ["dealLabel"],
        });
      } else if (cleanLabel.length > 24) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Custom deal label cannot exceed 24 characters",
          path: ["dealLabel"],
        });
      }
    }

    const nowMs = Date.now();
    // Offer dates are optional. If an end date is specified, it must be in the future.
    if (data.dealEndsAt && data.dealEndsAt.getTime() <= nowMs) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Offer end date must be in the future",
        path: ["dealEndsAt"],
      });
    }

    if (
      data.dealStartsAt &&
      data.dealEndsAt &&
      data.dealEndsAt.getTime() <= data.dealStartsAt.getTime()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Offer end date must be after start date",
        path: ["dealEndsAt"],
      });
    }
  }
}

export const ProjectSchema = z
  .object(projectFields)
  .superRefine((data, ctx) => applyPricingOfferSuperRefine(data, ctx, false));

export const ProjectUpdateSchema = z
  .object(projectFields)
  .partial()
  .superRefine((data, ctx) => applyPricingOfferSuperRefine(data, ctx, true));

export type ProjectInput = z.infer<typeof ProjectSchema>;
export type ProjectUpdateInput = z.infer<typeof ProjectUpdateSchema>;
