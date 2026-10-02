// tests/unit/security-headers.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import nextConfig from "@/next.config";

describe("Security Headers & CSP Hardening (M7 / N1 / N11)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it("enforces frame-ancestors 'none' and X-Frame-Options: DENY in production regardless of VERCEL env", async () => {
    (process.env as any).NODE_ENV = "production";
    delete process.env.VERCEL;
    process.env.ALLOW_AI_STUDIO_PREVIEW = "true"; // Must still be ignored in production

    const headerConfigs = await nextConfig.headers!();
    const rootConfig = headerConfigs.find((h) => h.source === "/(.*)");
    const headersMap = new Map(rootConfig?.headers.map((h) => [h.key, h.value]));

    expect(headersMap.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headersMap.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headersMap.get("Cross-Origin-Opener-Policy")).toBe("same-origin");
    expect(headersMap.get("X-Frame-Options")).toBe("DENY");
    expect(headersMap.get("Strict-Transport-Security")).toContain("max-age=63072000");

    const csp = headersMap.get("Content-Security-Policy")!;
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-src 'self' https://challenges.cloudflare.com");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("frame-ancestors 'self'");
    expect(csp).not.toMatch(/frame-ancestors[^;]*\s\*/);
    expect(csp).not.toContain("wss:");
    expect(csp).not.toContain("*.neon.tech");
    expect(csp).not.toContain("*.upstash.io");
  });

  it("allows explicit AI Studio preview origins only when NODE_ENV !== 'production' and ALLOW_AI_STUDIO_PREVIEW === 'true', never bare *", async () => {
    (process.env as any).NODE_ENV = "development";
    process.env.ALLOW_AI_STUDIO_PREVIEW = "true";

    const headerConfigs = await nextConfig.headers!();
    const rootConfig = headerConfigs.find((h) => h.source === "/(.*)");
    const headersMap = new Map(rootConfig?.headers.map((h) => [h.key, h.value]));

    const csp = headersMap.get("Content-Security-Policy")!;
    expect(csp).toContain(
      "frame-ancestors 'self' https://*.run.app https://*.google.com https://*.google.dev"
    );
    // Must NEVER include a bare wildcard *
    expect(csp).not.toMatch(/frame-ancestors[^;]*\s\*(?:;|$)/);
  });
});
