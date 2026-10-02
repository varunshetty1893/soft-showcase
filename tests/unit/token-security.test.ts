// tests/unit/token-security.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifySecretToken, hashSecretToken } from "@/lib/utils/crypto";
import { POST as verifyOtpHandler } from "@/app/api/auth/verify-otp/route";
import { db } from "@/lib/db/client";
import { otpVerifyLimiter } from "@/lib/utils/rate-limit";

vi.mock("@/lib/email/email-service", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
}));

describe("Token Hardening & Abuse Prevention (M5)", () => {
  const secretCode = "729415";
  const hashedCode = hashSecretToken(secretCode);

  it("verifySecretToken strictly validates matching SHA-256 hashes", () => {
    expect(verifySecretToken(secretCode, hashedCode)).toBe(true);
    expect(verifySecretToken("123456", hashedCode)).toBe(false);
  });

  it("verifySecretToken no longer accepts legacy plaintext tokens", () => {
    // Stored as plaintext (6 chars), not 64-char hex hash
    const plaintextStored = "729415";
    expect(verifySecretToken(secretCode, plaintextStored)).toBe(false);
  });

  it("verifySecretToken rejects malformed or non-hex stored tokens safely", () => {
    expect(verifySecretToken(secretCode, "")).toBe(false);
    expect(verifySecretToken(secretCode, "invalid-short-hash")).toBe(false);
    expect(verifySecretToken("", hashedCode)).toBe(false);
  });

  it("attacker burning the rate limiter does NOT delete the victim's valid token", async () => {
    const victimEmail = "victim@example.com";
    const validOtp = "846201";

    // Create pending registration for victim
    await db.pendingRegistration.deleteMany({ where: { email: victimEmail } });
    await db.pendingRegistration.create({
      data: {
        email: victimEmail,
        name: "Victim User",
        passwordHash: "hash-victim",
        codeHash: hashSecretToken(validOtp),
        attempts: 0,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // Attacker spams wrong codes from their IP to trip rate limiting
    // The rate limiter triggers, but victim's token must NOT be deleted
    const burnReq = new Request("http://localhost:3000/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.99" },
      body: JSON.stringify({ email: victimEmail, otp: "000000" }),
    });

    await verifyOtpHandler(burnReq);

    // Verify token still exists in PendingRegistration
    const record = await db.pendingRegistration.findUnique({
      where: { email: victimEmail },
    });
    expect(record).not.toBeNull();
    expect(record?.email).toBe(victimEmail);
  });

  it("wrong OTP code increments attempts; 6th wrong code invalidates the token", async () => {
    const testEmail = "attempts-test@example.com";
    const realOtp = "654321";

    await db.pendingRegistration.deleteMany({ where: { email: testEmail } });
    await db.pendingRegistration.create({
      data: {
        email: testEmail,
        name: "Attempts Tester",
        passwordHash: "hash",
        codeHash: hashSecretToken(realOtp),
        attempts: 0,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // Send 5 wrong attempts
    for (let i = 0; i < 5; i++) {
      const wrongReq = new Request("http://localhost:3000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": `10.0.9.${i}` },
        body: JSON.stringify({ email: testEmail, otp: "111111" }),
      });
      const res = await verifyOtpHandler(wrongReq);
      expect(res.status).toBe(400);
    }

    // Reset rate limiter on email to isolate testing the token-level attempt counter (M5)
    await otpVerifyLimiter.reset(`email:${testEmail}`);

    // 6th attempt should return invalidated notice and purge the record
    const sixthReq = new Request("http://localhost:3000/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.9.6" },
      body: JSON.stringify({ email: testEmail, otp: "111111" }),
    });
    const sixthRes = await verifyOtpHandler(sixthReq);
    expect(sixthRes.status).toBe(400);
    const data = await sixthRes.json();
    expect(data.error).toContain("Too many failed attempts");

    // Token record is now purged
    const deletedRecord = await db.pendingRegistration.findUnique({
      where: { email: testEmail },
    });
    expect(deletedRecord).toBeNull();
  });

  it("N6: firing 20 parallel wrong OTP guesses evaluates at most 5 attempts atomically and rejects 6th+ without exceeding cap", async () => {
    const parallelEmail = "parallel-atomic@example.com";
    const realOtp = "987654";

    await db.pendingRegistration.deleteMany({ where: { email: parallelEmail } });
    await db.pendingRegistration.create({
      data: {
        email: parallelEmail,
        name: "Parallel User",
        passwordHash: "hash-parallel",
        codeHash: hashSecretToken(realOtp),
        attempts: 0,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    // Spy onotpVerifyLimiter.check so rate limiting doesn't block the 20 parallel requests—
    // we want all 20 to hit the atomic DB attempt claim simultaneously!
    const checkSpy = vi.spyOn(otpVerifyLimiter, "check").mockResolvedValue({
      success: true,
      remaining: 39,
      reset: Date.now() + 60_000,
    });

    const requests = Array.from({ length: 20 }, (_, idx) =>
      verifyOtpHandler(
        new Request("http://localhost:3000/api/auth/verify-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": `10.20.0.${idx + 1}`,
          },
          body: JSON.stringify({
            email: parallelEmail,
            otp: String(100000 + idx),
          }),
        })
      )
    );

    const responses = await Promise.all(requests);
    const payloads = await Promise.all(responses.map((r) => r.json()));

    // Count how many responses evaluated the OTP ("Invalid verification code. X attempt(s) remaining.")
    const evaluatedResponses = payloads.filter(
      (p) => typeof p.error === "string" && p.error.startsWith("Invalid verification code.")
    );
    // Count how many were rejected as locked/expired/not found
    const rejectedResponses = payloads.filter(
      (p) =>
        typeof p.error === "string" &&
        (p.error.includes("Too many failed attempts") || p.error.includes("expired or was not found"))
    );

    expect(evaluatedResponses.length).toBe(5);
    expect(rejectedResponses.length).toBe(15);

    checkSpy.mockRestore();
  });
});
