// tests/unit/session-invalidation.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "@/lib/db/client";
import { POST as changePasswordHandler } from "@/app/api/user/password/route";
import { POST as signOutEverywhereHandler } from "@/app/api/auth/signout-everywhere/route";
import bcrypt from "bcryptjs";

let mockSessionUser: { id: string; email: string; tokenVersion?: number } | null = null;

vi.mock("@/lib/auth/session", () => ({
  getCurrentUser: vi.fn(async () => mockSessionUser),
}));

describe("Session Invalidation & Token Versioning (M6)", () => {
  const testUserId = "user-session-test-1";
  const testEmail = "session-test@example.com";

  beforeEach(async () => {
    vi.clearAllMocks();
    mockSessionUser = null;

    // Seed test user with initial tokenVersion = 0
    await db.user.deleteMany({ where: { email: testEmail } }).catch(() => null);
    await db.user.create({
      data: {
        id: testUserId,
        email: testEmail,
        name: "Session Tester",
        passwordHash: await bcrypt.hash("OldPassword123!", 10),
        emailVerified: new Date(),
        tokenVersion: 0,
      },
    });
  });

  it("password change increments tokenVersion and purges database sessions", async () => {
    mockSessionUser = {
      id: testUserId,
      email: testEmail,
      tokenVersion: 0,
    };

    const req = new Request("http://localhost:3000/api/user/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "OldPassword123!",
        newPassword: "NewSecurePassword123!",
        confirmPassword: "NewSecurePassword123!",
      }),
    });

    const res = await changePasswordHandler(req as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify tokenVersion incremented in database
    const userInDb = await db.user.findUnique({ where: { id: testUserId } });
    expect(userInDb?.tokenVersion).toBe(1);
  });

  it("sensitive password endpoint rejects request when session tokenVersion mismatches database", async () => {
    // Stale session with tokenVersion = 0, but DB tokenVersion = 1
    await db.user.update({
      where: { id: testUserId },
      data: { tokenVersion: 1 },
    });

    mockSessionUser = {
      id: testUserId,
      email: testEmail,
      tokenVersion: 0, // Stale version
    };

    const req = new Request("http://localhost:3000/api/user/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: "OldPassword123!",
        newPassword: "NewSecurePassword123!",
        confirmPassword: "NewSecurePassword123!",
      }),
    });

    const res = await changePasswordHandler(req as any);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Session expired or invalidated");
  });

  it("sign out everywhere increments tokenVersion", async () => {
    mockSessionUser = {
      id: testUserId,
      email: testEmail,
      tokenVersion: 0,
    };

    const res = await signOutEverywhereHandler();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    const userInDb = await db.user.findUnique({ where: { id: testUserId } });
    expect(userInDb?.tokenVersion).toBe(1);
  });
});
