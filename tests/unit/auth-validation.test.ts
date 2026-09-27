import { describe, it, expect } from "vitest";
import {
  RegisterSchema,
  LoginSchema,
  VerifyOtpSchema,
  ResendOtpSchema,
} from "@/lib/validation/auth.schema";

describe("Auth Validation Schemas", () => {
  describe("RegisterSchema", () => {
    it("should accept valid registration details", () => {
      const result = RegisterSchema.safeParse({
        name: "Varun Shetty",
        email: "varun@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("varun@example.com");
      }
    });

    it("should reject short names", () => {
      const result = RegisterSchema.safeParse({
        name: "A",
        email: "varun@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("Full name must be at least 2 characters");
      }
    });

    it("should reject invalid emails", () => {
      const result = RegisterSchema.safeParse({
        name: "Varun Shetty",
        email: "not-an-email",
        password: "Password123",
        confirmPassword: "Password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("valid email");
      }
    });

    it("should reject passwords shorter than 8 characters", () => {
      const result = RegisterSchema.safeParse({
        name: "Varun Shetty",
        email: "varun@example.com",
        password: "Pass1",
        confirmPassword: "Pass1",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("at least 8 characters");
      }
    });

    it("should reject passwords without numbers", () => {
      const result = RegisterSchema.safeParse({
        name: "Varun Shetty",
        email: "varun@example.com",
        password: "PasswordOnly",
        confirmPassword: "PasswordOnly",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("at least one number");
      }
    });

    it("should reject mismatched passwords", () => {
      const result = RegisterSchema.safeParse({
        name: "Varun Shetty",
        email: "varun@example.com",
        password: "Password123",
        confirmPassword: "DifferentPassword123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0]?.message).toContain("Passwords do not match");
      }
    });
  });

  describe("LoginSchema", () => {
    it("should accept valid email and password", () => {
      const result = LoginSchema.safeParse({
        email: "User@example.com",
        password: "mypassword",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });

    it("should reject missing password", () => {
      const result = LoginSchema.safeParse({
        email: "user@example.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("VerifyOtpSchema", () => {
    it("should accept valid 6-digit OTP", () => {
      const result = VerifyOtpSchema.safeParse({
        email: "user@example.com",
        otp: "123456",
      });
      expect(result.success).toBe(true);
    });

    it("should reject non-numeric OTP", () => {
      const result = VerifyOtpSchema.safeParse({
        email: "user@example.com",
        otp: "12345a",
      });
      expect(result.success).toBe(false);
    });

    it("should reject OTP with wrong length", () => {
      const result = VerifyOtpSchema.safeParse({
        email: "user@example.com",
        otp: "12345",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ResendOtpSchema", () => {
    it("should accept valid email", () => {
      const result = ResendOtpSchema.safeParse({
        email: "user@example.com",
      });
      expect(result.success).toBe(true);
    });
  });
});
