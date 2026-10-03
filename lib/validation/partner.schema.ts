// lib/validation/partner.schema.ts
// Zod schemas for Solution Partner registration, status updates, and verification.

import { z } from "zod";
import { isValidPhone, normalizeToE164 } from "@/lib/utils/phone";

export const PartnerRegisterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters")
      .max(60, "Full name cannot exceed 60 characters"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long")
      .max(100, "Password is too long")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    whatsappNumber: z
      .string()
      .trim()
      .transform((val) => {
        const normalized = normalizeToE164(val);
        return normalized || val;
      })
      .refine(
        (val) => isValidPhone(val),
        "Please enter a valid WhatsApp phone number with country code (e.g. +91 98765 43210)"
      ),
    displayName: z
      .string()
      .trim()
      .min(2, "Partner / Studio display name must be at least 2 characters")
      .max(80, "Display name cannot exceed 80 characters"),
    bio: z
      .string()
      .trim()
      .min(10, "Please provide a short professional description (at least 10 characters)")
      .max(1000, "Bio cannot exceed 1000 characters"),
    skills: z.union([
      z.array(z.string().trim().max(50)).max(20, "Maximum 20 skills allowed"),
      z.string().transform((str) =>
        str
          .split(",")
          .map((s) => s.trim().slice(0, 50))
          .filter(Boolean)
          .slice(0, 20)
      ),
    ]),
    technologies: z.union([
      z.array(z.string().trim().max(50)).max(20, "Maximum 20 technologies allowed"),
      z.string().transform((str) =>
        str
          .split(",")
          .map((s) => s.trim().slice(0, 50))
          .filter(Boolean)
          .slice(0, 20)
      ),
    ]),
    experience: z.string().trim().max(500).optional().nullable().or(z.literal("")),
    portfolioUrl: z.union([z.string().url("Please provide a valid portfolio URL (e.g. https://yourportfolio.dev)"), z.literal(""), z.null()]).optional(),
    githubUrl: z
      .string()
      .trim()
      .min(1, "GitHub profile URL is required")
      .url("Please provide a valid GitHub profile URL (e.g. https://github.com/username)"),
    linkedinUrl: z
      .string()
      .trim()
      .min(1, "LinkedIn profile URL is required")
      .url("Please provide a valid LinkedIn profile URL (e.g. https://linkedin.com/in/username)"),
    solutionsOffered: z
      .string()
      .trim()
      .min(2, "Types of solutions you offer is required (e.g. Web Apps, Microservices, Mobile Apps)")
      .max(500),
    expertiseAreas: z.string().trim().max(500).optional().nullable().or(z.literal("")),
    location: z
      .string()
      .trim()
      .min(2, "Location / Region is required (e.g. Bengaluru, India or Remote)")
      .max(100),
    acceptedPartnerTerms: z.literal(true, {
      errorMap: () => ({
        message: "You must confirm that you have the right to list and distribute your solutions",
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PartnerRegisterInput = z.infer<typeof PartnerRegisterSchema>;

export const PartnerStatusUpdateSchema = z.object({
  applicationStatus: z.enum(["pending", "approved", "rejected", "suspended", "deactivated"]),
  isActive: z.boolean().optional(),
  showWhatsapp: z.boolean().optional(),
  showEmail: z.boolean().optional(),
  providerConsentConfirmed: z.boolean().optional(),
  rejectionReason: z.string().trim().max(500).optional().nullable(),
  adminNotes: z.string().trim().max(2000).optional().nullable(),
  verificationStatus: z.enum(["not_required", "pending", "submitted", "verified", "rejected"]).optional(),
  verificationNotes: z.string().trim().max(1000).optional().nullable(),
});

export type PartnerStatusUpdateInput = z.infer<typeof PartnerStatusUpdateSchema>;

export const PartnerProfileUpdateSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters")
    .max(80, "Display name cannot exceed 80 characters")
    .optional(),
  bio: z
    .string()
    .trim()
    .min(10, "Please provide a short professional description (at least 10 characters)")
    .max(1000, "Bio cannot exceed 1000 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
  whatsappNumber: z
    .string()
    .trim()
    .transform((val) => {
      if (!val) return val;
      const normalized = normalizeToE164(val);
      return normalized || val;
    })
    .refine(
      (val) => !val || isValidPhone(val),
      "Please enter a valid WhatsApp phone number with country code (e.g. +91 98765 43210)"
    )
    .optional()
    .nullable()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .trim()
    .url("Please provide a valid image URL")
    .max(500)
    .optional()
    .nullable()
    .or(z.literal("")),
  skills: z
    .union([
      z.array(z.string().trim().max(50)).max(20, "Maximum 20 skills allowed"),
      z.string().transform((str) =>
        str
          .split(",")
          .map((s) => s.trim().slice(0, 50))
          .filter(Boolean)
          .slice(0, 20)
      ),
    ])
    .optional(),
  technologies: z
    .union([
      z.array(z.string().trim().max(50)).max(20, "Maximum 20 technologies allowed"),
      z.string().transform((str) =>
        str
          .split(",")
          .map((s) => s.trim().slice(0, 50))
          .filter(Boolean)
          .slice(0, 20)
      ),
    ])
    .optional(),
  experience: z.string().trim().max(500).optional().nullable().or(z.literal("")),
  portfolioUrl: z
    .string()
    .trim()
    .url("Please provide a valid portfolio URL (e.g. https://yourportfolio.dev)")
    .max(300)
    .optional()
    .nullable()
    .or(z.literal("")),
  githubUrl: z
    .string()
    .trim()
    .url("Please provide a valid GitHub profile URL (e.g. https://github.com/username)")
    .max(300)
    .optional()
    .nullable()
    .or(z.literal("")),
  linkedinUrl: z
    .string()
    .trim()
    .url("Please provide a valid LinkedIn profile URL (e.g. https://linkedin.com/in/username)")
    .max(300)
    .optional()
    .nullable()
    .or(z.literal("")),
  location: z.string().trim().max(100).optional().nullable().or(z.literal("")),
  showEmail: z.boolean().optional(),
  showWhatsapp: z.boolean().optional(),
});

export type PartnerProfileUpdateInput = z.infer<typeof PartnerProfileUpdateSchema>;

