// tests/unit/rate-limit.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractClientIpOrFingerprint,
  createRateLimiter,
} from "@/lib/utils/rate-limit";

describe("Client IP Extraction & Spoofing Defense (M2)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it("prioritizes platform-set x-vercel-forwarded-for header", () => {
    const headers = new Headers({
      "x-vercel-forwarded-for": "198.51.100.25",
      "x-real-ip": "203.0.113.10",
      "x-forwarded-for": "1.1.1.1, 203.0.113.10",
    });

    const ip = extractClientIpOrFingerprint(headers);
    expect(ip).toBe("198.51.100.25");
  });

  it("prioritizes x-real-ip when x-vercel-forwarded-for is missing", () => {
    const headers = new Headers({
      "x-real-ip": "203.0.113.10",
      "x-forwarded-for": "1.1.1.1, 203.0.113.10",
    });

    const ip = extractClientIpOrFingerprint(headers);
    expect(ip).toBe("203.0.113.10");
  });

  it("never trusts leftmost client-spoofed entry in x-forwarded-for with TRUSTED_PROXY_COUNT=1", () => {
    process.env.TRUSTED_PROXY_COUNT = "1";
    // Client sends spoofed leftmost IP "1.2.3.4", reverse proxy appends "198.51.100.77"
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4, 198.51.100.77",
    });

    const ip = extractClientIpOrFingerprint(headers);
    expect(ip).toBe("198.51.100.77");
    expect(ip).not.toBe("1.2.3.4");
  });

  it("selects correct proxy hop with TRUSTED_PROXY_COUNT=2", () => {
    process.env.TRUSTED_PROXY_COUNT = "2";
    // 3 hops: spoofed, first proxy, edge proxy
    const headers = new Headers({
      "x-forwarded-for": "1.2.3.4, 198.51.100.50, 203.0.113.99",
    });

    const ip = extractClientIpOrFingerprint(headers);
    // targetIndex = Math.max(0, 3 - 2) = 1 -> "198.51.100.50"
    expect(ip).toBe("198.51.100.50");
  });

  it("falls back to hashed user-agent + accept-language fingerprint bucket when no IP headers exist", () => {
    const headers = new Headers({
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "accept-language": "en-US,en;q=0.9",
    });

    const fp = extractClientIpOrFingerprint(headers);
    expect(fp).toMatch(/^fp_[a-f0-9]{16}$/);

    // Different user agent generates distinct bucket
    const headersDifferent = new Headers({
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      "accept-language": "en-US,en;q=0.9",
    });
    const fpDifferent = extractClientIpOrFingerprint(headersDifferent);
    expect(fpDifferent).toMatch(/^fp_[a-f0-9]{16}$/);
    expect(fp).not.toBe(fpDifferent);
  });
});

describe("Rate Limiter Reliability & Fail Modes (M3)", () => {
  it("in-memory limiter correctly tracks window and returns success / limited status", async () => {
    const testLimiter = createRateLimiter(
      { limit: 2, windowMs: 60 * 1000, failMode: "closed" },
      "test_mem"
    );

    // Call 1: success
    const res1 = await testLimiter.check("user-1");
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(1);

    // Call 2: success, remaining 0
    const res2 = await testLimiter.check("user-1");
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(0);

    // Call 3: limited
    const res3 = await testLimiter.check("user-1");
    expect(res3.success).toBe(false);
    expect(res3.remaining).toBe(0);
    expect(res3.reset).toBeGreaterThan(Date.now());
  });

  it("fail-closed mode returns success=false and error=true when backing store throws", async () => {
    // Force upstash rate limiting with a broken mock
    process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";
    process.env.RATE_LIMIT_PROVIDER = "upstash";

    // Mock upstash ratelimit to simulate a store outage
    vi.mock("@upstash/ratelimit", () => {
      return {
        Ratelimit: class MockRatelimit {
          static slidingWindow = vi.fn();
          limit = vi.fn().mockRejectedValue(new Error("Redis connection timeout"));
        },
      };
    });

    const closedLimiter = createRateLimiter(
      { limit: 5, windowMs: 60 * 1000, failMode: "closed" },
      "test_closed_error"
    );

    const res = await closedLimiter.check("key-1");
    expect(res.success).toBe(false);
    expect(res.error).toBe(true);
    expect(res.remaining).toBe(0);
  });

  it("fail-open mode returns success=true and error=true when backing store throws", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";
    process.env.RATE_LIMIT_PROVIDER = "upstash";

    const openLimiter = createRateLimiter(
      { limit: 5, windowMs: 60 * 1000, failMode: "open" },
      "test_open_error"
    );

    const res = await openLimiter.check("key-1");
    expect(res.success).toBe(true);
    expect(res.error).toBe(true);
  });
});
