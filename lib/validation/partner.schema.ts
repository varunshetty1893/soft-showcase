// lib/validation/partner.schema.ts
// Zod schemas for Solution Partner registration, status updates, and verification.

import { z } from "zod";

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
        const cleaned = val.replace(/[\s\-()]/g, "");
        if (/^\d{12}$/.test(cleaned)) {
          return `+${cleaned}`;
        }
        return cleaned;
      })
      .refine(
        (val) => /^\+[1-9]\d{11}$/.test(val),
        "WhatsApp number must contain exactly 13 characters including country code (e.g. +919876543210)"
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
      z.array(z.string()),
      z.string().transform((str) =>
        str
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      ),
    ]),
    technologies: z.union([
      z.array(z.string()),
      z.string().transform((str) =>
        str
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
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
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type PartnerRegisterInput = z.infer<typeof PartnerRegisterSchema>;

export const PartnerStatusUpdateSchema = z.object({
  applicationStatus: z.enum(["pending", "approved", "rejected", "suspended", "deactivated"]),
  rejectionReason: z.string().trim().max(500).optional().nullable(),
  adminNotes: z.string().trim().max(2000).optional().nullable(),
  verificationStatus: z.enum(["not_required", "pending", "submitted", "verified", "rejected"]).optional(),
  verificationNotes: z.string().trim().max(1000).optional().nullable(),
});

export type PartnerStatusUpdateInput = z.infer<typeof PartnerStatusUpdateSchema>;
