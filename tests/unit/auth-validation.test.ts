import { describe, it, expect, vi } from "vitest";
import bcrypt from "bcryptjs";
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

  describe("Credentials authorize() Timing-Path Parity (N8)", () => {
    it("calls bcrypt.compare on both unknown-user and wrong-password paths and returns identical null", async () => {
      let capturedAuthorize: ((creds: any, req: any) => Promise<any>) | null = null;

      vi.resetModules();
      vi.doMock("next-auth/providers/credentials", () => ({
        default: (config: any) => {
          capturedAuthorize = config.authorize;
          return config;
        },
      }));
      vi.doMock("next-auth", () => ({
        default: (config: any) => ({
          handlers: {},
          auth: vi.fn(),
          signIn: vi.fn(),
          signOut: vi.fn(),
          _config: config,
        }),
        CredentialsSignin: class CredentialsSignin extends Error {},
      }));

      await import("@/lib/auth/auth");
      expect(capturedAuthorize).toBeTypeOf("function");

      const compareSpy = vi.spyOn(bcrypt, "compare");
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // 1. Unknown user path -> must still call bcrypt.compare against dummy hash
      const req1 = new Request("http://localhost:3000/api/auth/callback/credentials", {
        headers: { "x-forwarded-for": "203.0.113.111" },
      });
      const resUnknown = await capturedAuthorize!(
        { email: "nonexistent-timing-user@example.com", password: "WrongPassword123" },
        req1
      );
      expect(resUnknown).toBeNull();
      expect(compareSpy).toHaveBeenCalledTimes(1);

      // 2. Existing user with wrong password -> calls bcrypt.compare against user.passwordHash
      const { db } = await import("@/lib/db/client");
      const realHash = await bcrypt.hash("CorrectPassword123", 10);
      await db.user.upsert({
        where: { email: "existing-timing-user@example.com" },
        update: { passwordHash: realHash, emailVerified: new Date() },
        create: {
          email: "existing-timing-user@example.com",
          name: "Timing User",
          passwordHash: realHash,
          emailVerified: new Date(),
        },
      });

      compareSpy.mockClear();
      const req2 = new Request("http://localhost:3000/api/auth/callback/credentials", {
        headers: { "x-forwarded-for": "203.0.113.112" },
      });
      const resWrongPwd = await capturedAuthorize!(
        { email: "existing-timing-user@example.com", password: "WrongPassword123" },
        req2
      );
      expect(resWrongPwd).toBeNull();
      expect(compareSpy).toHaveBeenCalledTimes(1);

      compareSpy.mockRestore();
      warnSpy.mockRestore();
      vi.doUnmock("next-auth/providers/credentials");
      vi.doUnmock("next-auth");
    });
  });
});
