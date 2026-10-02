// tests/unit/turnstile.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";

describe("Cloudflare Turnstile Server Verification (N1)", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it("fails closed in production when TURNSTILE_SECRET_KEY is missing (returns not-configured)", async () => {
    (process.env as any).NODE_ENV = "production";
    delete process.env.TURNSTILE_SECRET_KEY;

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await verifyTurnstileToken("some-token", "198.51.100.1");

    expect(res.success).toBe(false);
    expect(res.errorCodes).toContain("not-configured");
    errorSpy.mockRestore();
  });

  it("bypasses in development/test when TURNSTILE_SECRET_KEY is unset", async () => {
    (process.env as any).NODE_ENV = "test";
    delete process.env.TURNSTILE_SECRET_KEY;

    const res = await verifyTurnstileToken(null);
    expect(res.success).toBe(true);
  });

  it("rejects missing or empty token when TURNSTILE_SECRET_KEY is set", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret-key";

    const res = await verifyTurnstileToken("");
    expect(res.success).toBe(false);
    expect(res.errorCodes).toContain("missing-input-response");
  });

  it("verifies valid token with mocked fetch and checks matching hostname", async () => {
    (process.env as any).NODE_ENV = "production";
    process.env.TURNSTILE_SECRET_KEY = "prod-secret-key";
    process.env.NEXT_PUBLIC_APP_URL = "https://softshowcase.example.com";

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        challenge_ts: "2026-10-02T00:00:00Z",
        hostname: "softshowcase.example.com",
      }),
    });
    global.fetch = fetchMock as any;

    const res = await verifyTurnstileToken("valid-cf-token", "203.0.113.10");
    expect(res.success).toBe(true);
    expect(res.hostname).toBe("softshowcase.example.com");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    expect(options.body).toContain("secret=prod-secret-key");
    expect(options.body).toContain("response=valid-cf-token");
    expect(options.body).toContain("remoteip=203.0.113.10");
  });

  it("rejects token when Cloudflare returns success: false", async () => {
    (process.env as any).NODE_ENV = "production";
    process.env.TURNSTILE_SECRET_KEY = "prod-secret-key";

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: false,
        "error-codes": ["invalid-input-response"],
      }),
    }) as any;

    const res = await verifyTurnstileToken("forged-token", "203.0.113.10");
    expect(res.success).toBe(false);
    expect(res.errorCodes).toContain("invalid-input-response");
  });

  it("rejects token when returned hostname mismatches expected app hostname in production", async () => {
    (process.env as any).NODE_ENV = "production";
    process.env.TURNSTILE_SECRET_KEY = "prod-secret-key";
    process.env.NEXT_PUBLIC_APP_URL = "https://softshowcase.example.com";

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        hostname: "attacker-site.evil.com",
      }),
    }) as any;

    const res = await verifyTurnstileToken("valid-token-wrong-host", "203.0.113.10");
    expect(res.success).toBe(false);
    expect(res.errorCodes).toContain("hostname-mismatch");
    warnSpy.mockRestore();
  });

  it("marks unreachable: true when Turnstile returns 5xx or throws network error", async () => {
    (process.env as any).NODE_ENV = "production";
    process.env.TURNSTILE_SECRET_KEY = "prod-secret-key";

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
    }) as any;

    const res502 = await verifyTurnstileToken("valid-token", "203.0.113.10");
    expect(res502.success).toBe(false);
    expect(res502.unreachable).toBe(true);
    warnSpy.mockRestore();
  });
});
