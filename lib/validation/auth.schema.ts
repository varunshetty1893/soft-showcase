import { z } from "zod";

/**
 * Validation schema for email & password registration.
 */
export const RegisterSchema = z
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
      .regex(/^\S+$/, "Password cannot contain spaces")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().optional(),
    acceptedTerms: z
      .literal(true, {
        errorMap: () => ({
          message: "You must agree to the Terms of Service and Privacy Policy to continue",
        }),
      })
      .optional(),
  })
  .refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * Validation schema for email & password login.
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Validation schema for 6-digit OTP verification.
 */
export const VerifyOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address"),
  otp: z
    .string()
    .trim()
    .length(6, "Verification code must be exactly 6 digits")
    .regex(/^\d+$/, "Verification code must only contain numbers"),
});

export type VerifyOtpInput = z.infer<typeof VerifyOtpSchema>;

/**
 * Validation schema for resending OTP.
 */
export const ResendOtpSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address"),
});

export type ResendOtpInput = z.infer<typeof ResendOtpSchema>;
