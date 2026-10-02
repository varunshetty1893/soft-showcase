// tests/integration/registration-security.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { POST as verifyOtpHandler } from "@/app/api/auth/verify-otp/route";
import { db } from "@/lib/db/client";
import { hashSecretToken } from "@/lib/utils/crypto";
import { otpVerifyLimiter } from "@/lib/utils/rate-limit";

// Mock email service to prevent network calls
vi.mock("@/lib/email/email-service", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
  sendAccountExistsEmail: vi.fn().mockResolvedValue({ success: true }),
}));

describe("Registration Security, Anti-Enumeration & Verified User Protection (H3 / N5)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it("returns identical generic response for new registration vs existing verified user", async () => {
    // 1. Register new email
    const req1 = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: "newuser@example.com",
        password: "Password123!",
      }),
    });

    const res1 = await registerHandler(req1);
    expect(res1.status).toBe(200);
    const body1 = await res1.json();

    // 2. Pre-create verified user
    await db.user.upsert({
      where: { email: "verified@example.com" },
      update: { emailVerified: new Date() },
      create: {
        email: "verified@example.com",
        name: "Verified User",
        emailVerified: new Date(),
        passwordHash: "existing-hash-12345",
      },
    });

    // 3. Register existing verified email
    const req2 = new Request("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Attacker Attempt",
        email: "verified@example.com",
        password: "AttackerPassword123!",
      }),
    });

    const res2 = await registerHandler(req2);
    expect(res2.status).toBe(200);
    const body2 = await res2.json();

    // Responses must be generic and identical (anti-enumeration)
    expect(body1.success).toBe(true);
    expect(body2.success).toBe(true);
    expect(body1.message).toBe(body2.message);
    expect(body2.message).toContain("If you do not have an account");

    // Verified user's password must NOT be overwritten
    const verifiedUser = await db.user.findUnique({
      where: { email: "verified@example.com" },
    });
    expect(verifiedUser?.passwordHash).toBe("existing-hash-12345");
  });

  it("N5: confirming a pending registration when user already has emailVerified set NEVER overwrites their password or name", async () => {
    const email = "already-verified-owner@example.com";
    const otp = "314159";

    await db.user.deleteMany({ where: { email } });
    await db.pendingRegistration.deleteMany({ where: { email } });
    await otpVerifyLimiter.reset(`email:${email}`);

    // Existing verified user
    await db.user.create({
      data: {
        email,
        name: "Original Verified Name",
        passwordHash: "original-verified-password-hash",
        emailVerified: new Date("2025-01-01T00:00:00Z"),
        role: "customer",
        isAdmin: false,
      },
    });

    // Stale/concurrent pending registration with a different passwordHash
    await db.pendingRegistration.create({
      data: {
        email,
        name: "Overwritten Name",
        passwordHash: "attacker-or-stale-password-hash",
        codeHash: hashSecretToken(otp),
        attempts: 0,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const res = await verifyOtpHandler(
      new Request("http://localhost:3000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.5.1" },
        body: JSON.stringify({ email, otp }),
      })
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.accountAlreadyExists).toBe(true);

    // Verified user's passwordHash and name MUST be untouched
    const userAfter = await db.user.findUnique({ where: { email } });
    expect(userAfter?.passwordHash).toBe("original-verified-password-hash");
    expect(userAfter?.name).toBe("Original Verified Name");

    // Pending row is deleted
    const pendingAfter = await db.pendingRegistration.findUnique({ where: { email } });
    expect(pendingAfter).toBeNull();
  });

  it("N5: unverified existing user (emailVerified = null) receives the pending password and becomes verified", async () => {
    const email = "unverified-existing@example.com";
    const otp = "271828";

    await db.user.deleteMany({ where: { email } });
    await db.pendingRegistration.deleteMany({ where: { email } });
    await otpVerifyLimiter.reset(`email:${email}`);

    await db.user.create({
      data: {
        email,
        name: "Old Unverified Name",
        passwordHash: "old-unverified-hash",
        emailVerified: null,
        role: "customer",
        isAdmin: false,
      },
    });

    await db.pendingRegistration.create({
      data: {
        email,
        name: "Confirmed Name",
        passwordHash: "new-confirmed-hash",
        codeHash: hashSecretToken(otp),
        attempts: 0,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const res = await verifyOtpHandler(
      new Request("http://localhost:3000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.5.2" },
        body: JSON.stringify({ email, otp }),
      })
    );

    expect(res.status).toBe(200);
    const userAfter = await db.user.findUnique({ where: { email } });
    expect(userAfter?.passwordHash).toBe("new-confirmed-hash");
    expect(userAfter?.name).toBe("Confirmed Name");
    expect(userAfter?.emailVerified).not.toBeNull();
  });

  it("N5: concurrent verify calls for the same pending registration produce exactly one user", async () => {
    const email = "concurrent-verify@example.com";
    const otp = "161803";

    await db.user.deleteMany({ where: { email } });
    await db.pendingRegistration.deleteMany({ where: { email } });
    await otpVerifyLimiter.reset(`email:${email}`);

    await db.pendingRegistration.create({
      data: {
        email,
        name: "Concurrent User",
        passwordHash: "concurrent-hash",
        codeHash: hashSecretToken(otp),
        attempts: 0,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const [resA, resB] = await Promise.all([
      verifyOtpHandler(
        new Request("http://localhost:3000/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.5.3" },
          body: JSON.stringify({ email, otp }),
        })
      ),
      verifyOtpHandler(
        new Request("http://localhost:3000/api/auth/verify-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.5.4" },
          body: JSON.stringify({ email, otp }),
        })
      ),
    ]);

    const statuses = [resA.status, resB.status];
    expect(statuses).toContain(200);

    const allUsers = await db.user.findMany();
    const matchingUsers = allUsers.filter((u: any) => u.email?.toLowerCase() === email);
    expect(matchingUsers.length).toBe(1);
    expect(matchingUsers[0].passwordHash).toBe("concurrent-hash");
  });
});
