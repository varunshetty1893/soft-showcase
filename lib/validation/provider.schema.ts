// lib/validation/provider.schema.ts
// Zod validation schema for creating and editing project providers.

import { z } from "zod";

export const ProviderSchema = z.object({
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(100, "Display name must be under 100 characters")
    .trim(),

  email: z
    .string()
    .email("Please enter a valid email address")
    .max(255, "Email is too long")
    .trim()
    .toLowerCase(),

  whatsappNumber: z
    .string()
    .max(20, "WhatsApp number is too long")
    .trim()
    .optional()
    .nullable(),

  bio: z
    .string()
    .max(500, "Bio must be under 500 characters")
    .trim()
    .optional()
    .nullable(),

  avatarUrl: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .nullable(),

  isActive: z.boolean().default(true),
  showEmail: z.boolean().default(false),
  showWhatsapp: z.boolean().default(true),

  providerConsentConfirmed: z.boolean().default(false),
});

// Partial version for updates
export const ProviderUpdateSchema = ProviderSchema.partial();

export type ProviderInput = z.infer<typeof ProviderSchema>;
export type ProviderUpdateInput = z.infer<typeof ProviderUpdateSchema>;
