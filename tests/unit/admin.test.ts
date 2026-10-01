// tests/unit/admin.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { isAdminUser, getBootstrapAdminEmails, isConfiguredAdminEmail } from "@/lib/auth/admin";

describe("Admin Authorization & Bootstrap Hook (H2)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it("non-admin with admin-like email is NOT admin (trusts only DB flag)", () => {
    process.env.ADMIN_EMAIL = "admin@example.com";

    // User has admin-like email, but isAdmin is false and role is customer
    const userSession = {
      email: "admin@example.com",
      isAdmin: false,
      role: "customer",
    };

    expect(isAdminUser(userSession)).toBe(false);
  });

  it("admin flag from DB/token works correctly", () => {
    expect(isAdminUser({ isAdmin: true, role: "admin" })).toBe(true);
    expect(isAdminUser({ isAdmin: true, role: "customer" })).toBe(true);
    expect(isAdminUser({ isAdmin: false, role: "admin" })).toBe(true);
    expect(isAdminUser({ isAdmin: false, role: "customer" })).toBe(false);
    expect(isAdminUser(null)).toBe(false);
    expect(isAdminUser(undefined)).toBe(false);
  });

  it("parses comma-separated bootstrap admin emails", () => {
    process.env.ADMIN_EMAILS = "owner1@example.com, owner2@example.com ";
    process.env.ADMIN_EMAIL = "owner3@example.com";

    const emails = getBootstrapAdminEmails();
    expect(emails).toContain("owner1@example.com");
    expect(emails).toContain("owner2@example.com");
    expect(emails).toContain("owner3@example.com");
    expect(isConfiguredAdminEmail("OWNER1@example.com")).toBe(true);
    expect(isConfiguredAdminEmail("attacker@evil.com")).toBe(false);
  });
});
