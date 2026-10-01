// tests/unit/security-headers.test.ts
import { describe, it, expect } from "vitest";
import nextConfig from "@/next.config";

describe("Security Headers & CSP Hardening (M7)", () => {
  it("defines strict security headers", async () => {
    if (!nextConfig.headers) return;
    const headerConfigs = await nextConfig.headers();
    expect(headerConfigs.length).toBeGreaterThan(0);

    const rootConfig = headerConfigs.find((h) => h.source === "/(.*)");
    expect(rootConfig).toBeDefined();

    const headersMap = new Map(rootConfig?.headers.map((h) => [h.key, h.value]));

    // Base defense headers
    expect(headersMap.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headersMap.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(headersMap.get("Cross-Origin-Opener-Policy")).toBe("same-origin");

    // CSP content
    const csp = headersMap.get("Content-Security-Policy");
    expect(csp).toBeDefined();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("https://challenges.cloudflare.com");

    // Narrowed connect-src must NOT contain unnecessary endpoints
    expect(csp).not.toContain("wss:");
    expect(csp).not.toContain("*.neon.tech");
    expect(csp).not.toContain("*.upstash.io");
  });
});
