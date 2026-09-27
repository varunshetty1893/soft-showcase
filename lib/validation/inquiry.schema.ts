// lib/validation/inquiry.schema.ts
// Zod validation schema for the inquiry submission endpoint.
// This schema runs SERVER-SIDE only. The client never sends provider_id or email.

import { z } from "zod";

export const InquirySchema = z.object({
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
    .max(20, "WhatsApp number is too long")
    .trim()
    .optional()
    .nullable(),

  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be under 2000 characters")
    .trim(),

  contactMethod: z.enum(["EMAIL", "WHATSAPP"]).default("EMAIL"),
}).strict();

export type InquiryInput = z.infer<typeof InquirySchema>;
