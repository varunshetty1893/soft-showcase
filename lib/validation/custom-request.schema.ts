// lib/validation/custom-request.schema.ts
// Zod validation schema for the custom project request endpoint.

import { z } from "zod";
import { isValidPhone, normalizeToE164 } from "@/lib/utils/phone";

export const CustomRequestSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters")
    .trim(),

  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255)
    .trim()
    .toLowerCase(),

  whatsapp: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (val) => !val || isValidPhone(val),
      "Please enter a valid phone number with country code (e.g. +91 98765 43210)"
    )
    .transform((val) => (val ? normalizeToE164(val) ?? val : val)),

  projectTitle: z
    .string()
    .min(3, "Project title must be at least 3 characters")
    .max(150, "Project title must be under 150 characters")
    .trim(),

  category: z
    .string()
    .max(100)
    .trim()
    .optional()
    .nullable(),

  technologyPreferences: z
    .array(z.string().max(50).trim())
    .max(15, "Maximum 15 technology preferences")
    .default([]),

  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(3000, "Description must be under 3000 characters")
    .trim(),

  requiredFeatures: z
    .string()
    .min(10, "Required features must be at least 10 characters")
    .max(3000, "Required features must be under 3000 characters")
    .trim(),

  // Free-form deadline — e.g. "Q1 2027" or "March 2027"
  deadline: z
    .string()
    .max(100, "Deadline must be under 100 characters")
    .trim()
    .optional()
    .nullable(),

  budget: z
    .string()
    .max(100, "Budget must be under 100 characters")
    .trim()
    .optional()
    .nullable(),

  additionalRequirements: z
    .string()
    .max(2000, "Additional requirements must be under 2000 characters")
    .trim()
    .optional()
    .nullable(),

  // Anti-abuse protections (M4)
  turnstileToken: z.string().optional().nullable(),
  website: z.string().max(0, "Invalid submission").optional().nullable(),
  formSubmittedAt: z.number().optional().nullable(),
}).strict();

export type CustomRequestInput = z.infer<typeof CustomRequestSchema>;
