// tests/unit/env.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getEnv } from "@/lib/config/env";

describe("Environment Configuration (H1)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("throws in production when AUTH_SECRET is missing", () => {
    const fakeEnv = {
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://postgres:password@localhost:5432/db",
      NEXTAUTH_URL: "https://example.com",
    };

    expect(() => getEnv(fakeEnv)).toThrow(/Production environment validation failed.*AUTH_SECRET/);
  });

  it("throws in production when AUTH_SECRET is shorter than 32 characters", () => {
    const fakeEnv = {
      NODE_ENV: "production",
      AUTH_SECRET: "too-short",
      DATABASE_URL: "postgresql://postgres:password@localhost:5432/db",
      NEXTAUTH_URL: "https://example.com",
    };

    expect(() => getEnv(fakeEnv)).toThrow(/AUTH_SECRET must be at least 32 characters/);
  });

  it("throws in production when AUTH_SECRET equals the deprecated hardcoded default", () => {
    const fakeEnv = {
      NODE_ENV: "production",
      AUTH_SECRET: "soft-showcase-secure-auth-jwt-secret-key-32-chars-long",
      DATABASE_URL: "postgresql://postgres:password@localhost:5432/db",
      NEXTAUTH_URL: "https://example.com",
    };

    expect(() => getEnv(fakeEnv)).toThrow(/deprecated default fallback secret/);
  });

  it("succeeds with a valid production configuration", () => {
    const fakeEnv = {
      NODE_ENV: "production",
      AUTH_SECRET: "valid-production-secret-must-be-very-long-and-secure-12345",
      DATABASE_URL: "postgresql://postgres:password@localhost:5432/db",
      NEXTAUTH_URL: "https://example.com",
      UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "mock-token",
    };

    const resolved = getEnv(fakeEnv);
    expect(resolved.AUTH_SECRET).toBe("valid-production-secret-must-be-very-long-and-secure-12345");
    expect(resolved.DATABASE_URL).toBe("postgresql://postgres:password@localhost:5432/db");
  });

  it("allows dev-only fallback secret in development with a console warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fakeEnv = {
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://localhost:5432/db",
    };

    const resolved = getEnv(fakeEnv);
    expect(resolved.AUTH_SECRET).toBeDefined();
    expect(resolved.AUTH_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("WARNING: AUTH_SECRET is not set"));
    warnSpy.mockRestore();
  });
});
