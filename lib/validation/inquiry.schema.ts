// lib/validation/inquiry.schema.ts
// Zod validation schema for the inquiry submission endpoint.
// This schema runs SERVER-SIDE only. The client never sends provider_id or email.

import { z } from "zod";
import { isValidPhone, normalizeToE164 } from "@/lib/utils/phone";

export const InquirySchema = z
  .object({
    projectId: z.string().min(1, "Project ID is required"),

    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must be under 100 characters")
      .trim(),

    email: z
      .string()
      .email("Please enter a valid email address")
      .max(255, "Email is too long")
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

    message: z
      .string()
      .min(10, "Message must be at least 10 characters")
      .max(2000, "Message must be under 2000 characters")
      .trim(),

    contactMethod: z.enum(["EMAIL", "WHATSAPP"]).default("EMAIL"),

    // Anti-abuse protections (M4)
    turnstileToken: z.string().optional().nullable(),
    website: z.string().max(0, "Invalid submission").optional().nullable(),
    formSubmittedAt: z.number().optional().nullable(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.contactMethod === "WHATSAPP") {
      if (!data.whatsapp || !data.whatsapp.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["whatsapp"],
          message:
            "WhatsApp phone number is required when WhatsApp contact method is selected",
        });
      } else if (!isValidPhone(data.whatsapp)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["whatsapp"],
          message:
            "Please enter a valid phone number with country code (e.g. +91 98765 43210)",
        });
      }
    }
  });

export type InquiryInput = z.infer<typeof InquirySchema>;
