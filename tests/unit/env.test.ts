// tests/unit/env.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getEnv } from "@/lib/config/env";

describe("Environment Configuration (H1 / N1 / N4)", () => {
  const originalEnv = process.env;

  const validProdEnv = {
    NODE_ENV: "production",
    AUTH_SECRET: "valid-production-secret-must-be-very-long-and-secure-12345",
    DATABASE_URL: "postgresql://postgres:password@localhost:5432/db",
    NEXTAUTH_URL: "https://example.com",
    UPSTASH_REDIS_REST_URL: "https://example.upstash.io",
    UPSTASH_REDIS_REST_TOKEN: "mock-token",
    TURNSTILE_SECRET_KEY: "0x4AAAAAA_prod_secret",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAAAA_prod_site_key",
  };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("throws in production when AUTH_SECRET is missing", () => {
    const fakeEnv = { ...validProdEnv, AUTH_SECRET: undefined };
    expect(() => getEnv(fakeEnv)).toThrow(/Production environment validation failed.*AUTH_SECRET/);
  });

  it("throws in production when AUTH_SECRET is shorter than 32 characters", () => {
    const fakeEnv = { ...validProdEnv, AUTH_SECRET: "too-short" };
    expect(() => getEnv(fakeEnv)).toThrow(/AUTH_SECRET must be at least 32 characters/);
  });

  it("throws in production when AUTH_SECRET equals the deprecated hardcoded default", () => {
    const fakeEnv = {
      ...validProdEnv,
      AUTH_SECRET: "soft-showcase-secure-auth-jwt-secret-key-32-chars-long",
    };
    expect(() => getEnv(fakeEnv)).toThrow(/deprecated default fallback secret/);
  });

  it("N4: throws in production runtime when UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing", () => {
    expect(() =>
      getEnv({ ...validProdEnv, UPSTASH_REDIS_REST_URL: undefined })
    ).toThrow(/UPSTASH_REDIS_REST_URL/);

    expect(() =>
      getEnv({ ...validProdEnv, UPSTASH_REDIS_REST_TOKEN: undefined })
    ).toThrow(/UPSTASH_REDIS_REST_TOKEN/);
  });

  it("N1: throws in production runtime when TURNSTILE_SECRET_KEY or NEXT_PUBLIC_TURNSTILE_SITE_KEY is missing", () => {
    expect(() =>
      getEnv({ ...validProdEnv, TURNSTILE_SECRET_KEY: undefined })
    ).toThrow(/TURNSTILE_SECRET_KEY/);

    expect(() =>
      getEnv({
        ...validProdEnv,
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: undefined,
        TURNSTILE_SITE_KEY: undefined,
      })
    ).toThrow(/NEXT_PUBLIC_TURNSTILE_SITE_KEY/);
  });

  it("succeeds with a valid production configuration", () => {
    const resolved = getEnv(validProdEnv);
    expect(resolved.AUTH_SECRET).toBe(validProdEnv.AUTH_SECRET);
    expect(resolved.DATABASE_URL).toBe(validProdEnv.DATABASE_URL);
    expect(resolved.UPSTASH_REDIS_REST_URL).toBe(validProdEnv.UPSTASH_REDIS_REST_URL);
    expect(resolved.TURNSTILE_SECRET_KEY).toBe(validProdEnv.TURNSTILE_SECRET_KEY);
    expect(resolved.NEXT_PUBLIC_TURNSTILE_SITE_KEY).toBe(
      validProdEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    );
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
