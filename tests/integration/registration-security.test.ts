// tests/integration/registration-security.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as registerHandler } from "@/app/api/auth/register/route";
import { db } from "@/lib/db/client";

// Mock email service to prevent network calls
vi.mock("@/lib/email/email-service", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
  sendAccountExistsEmail: vi.fn().mockResolvedValue({ success: true }),
}));

describe("Registration Security & Anti-Enumeration (H3)", () => {
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
});
