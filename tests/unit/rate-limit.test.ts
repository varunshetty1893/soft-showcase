// tests/unit/rate-limit.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  extractClientIpOrFingerprint,
  createRateLimiter,
  authLoginLimiter,
  authRegisterLimiter,
  otpVerifyLimiter,
} from "@/lib/utils/rate-limit";

const mockResetUsedTokens = vi.fn().mockResolvedValue(undefined);
const mockLimit = vi.fn();

vi.mock("@upstash/ratelimit", () => {
  return {
    Ratelimit: class MockRatelimit {
      static slidingWindow = vi.fn();
      limit = mockLimit;
      resetUsedTokens = mockResetUsedTokens;
    },
  };
});

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
    process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";
    process.env.RATE_LIMIT_PROVIDER = "upstash";

    mockLimit.mockRejectedValueOnce(new Error("Redis connection timeout"));

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

    mockLimit.mockRejectedValueOnce(new Error("Redis connection timeout"));

    const openLimiter = createRateLimiter(
      { limit: 5, windowMs: 60 * 1000, failMode: "open" },
      "test_open_error"
    );

    const res = await openLimiter.check("key-1");
    expect(res.success).toBe(true);
    expect(res.error).toBe(true);
  });

  it("N4: throws in production runtime when UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing", async () => {
    const prevNodeEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = "production";
    delete process.env.NEXT_PHASE;
    delete process.env.npm_lifecycle_event;
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const prodLimiter = createRateLimiter(
      { limit: 5, windowMs: 60_000, failMode: "closed" },
      "test_prod_no_redis"
    );

    await expect(prodLimiter.check("user-1")).rejects.toThrow(
      /UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production runtime/
    );

    (process.env as any).NODE_ENV = prevNodeEnv;
  });

  it("N7: reset(key) invokes upstashRatelimit.resetUsedTokens(key) and clears memory store", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://mock.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";
    process.env.RATE_LIMIT_PROVIDER = "upstash";

    mockLimit.mockResolvedValue({
      success: true,
      remaining: 4,
      reset: Date.now() + 60_000,
    });
    mockResetUsedTokens.mockClear();

    const limiter = createRateLimiter(
      { limit: 5, windowMs: 60_000, failMode: "closed" },
      "test_reset_upstash"
    );

    await limiter.check("email:alice@example.com");
    await limiter.reset("email:alice@example.com");

    expect(mockResetUsedTokens).toHaveBeenCalledWith("email:alice@example.com");
    delete process.env.RATE_LIMIT_PROVIDER;
  });

  it("N7 & N8: resetting email/email_ip keys on login success does NOT reset IP limiter; victim can still log in from another IP when attacker is locked", async () => {
    delete process.env.RATE_LIMIT_PROVIDER;
    const attackerIp = "198.51.100.200";
    const victimIp = "203.0.113.55";
    const victimEmail = "victim-login@example.com";

    await authLoginLimiter.reset(`ip:${attackerIp}`);
    await authLoginLimiter.reset(`ip:${victimIp}`);
    await authLoginLimiter.reset(`email:${victimEmail}`);
    await authLoginLimiter.reset(`email_ip:${victimEmail}:${attackerIp}`);
    await authLoginLimiter.reset(`email_ip:${victimEmail}:${victimIp}`);

    // Attacker makes 5 failed login attempts against victimEmail from attackerIp
    for (let i = 0; i < 5; i++) {
      expect((await authLoginLimiter.check(`ip:${attackerIp}`)).success).toBe(true);
      expect((await authLoginLimiter.check(`email_ip:${victimEmail}:${attackerIp}`)).success).toBe(true);
      expect((await authLoginLimiter.check(`email:${victimEmail}`)).success).toBe(true);
    }

    // 6th attempt from attackerIp for victimEmail is locked out by email_ip (5/15m)
    const attackerSixth = await authLoginLimiter.check(`email_ip:${victimEmail}:${attackerIp}`);
    expect(attackerSixth.success).toBe(false);

    // Victim logging in from victimIp is NOT locked out!
    expect((await authLoginLimiter.check(`ip:${victimIp}`)).success).toBe(true);
    expect((await authLoginLimiter.check(`email_ip:${victimEmail}:${victimIp}`)).success).toBe(true);
    expect((await authLoginLimiter.check(`email:${victimEmail}`)).success).toBe(true);

    // On successful login, only email-scoped keys are reset, never ip:${attackerIp}
    await authLoginLimiter.reset(`email_ip:${victimEmail}:${victimIp}`);
    await authLoginLimiter.reset(`email:${victimEmail}`);

    // Exhaust remaining 25 attempts on attackerIp (5 already used + 25 = 30 IP ceiling)
    for (let i = 0; i < 25; i++) {
      await authLoginLimiter.check(`ip:${attackerIp}`);
    }
    // Even if attacker logs into their own account and resets their own email key, ip:${attackerIp} remains locked!
    await authLoginLimiter.reset(`email:attacker-own@example.com`);
    await authLoginLimiter.reset(`email_ip:attacker-own@example.com:${attackerIp}`);
    const ipStillLocked = await authLoginLimiter.check(`ip:${attackerIp}`);
    expect(ipStillLocked.success).toBe(false);
  });

  it("N9: shared-IP two-key model allows 5 attempts per email while allowing up to 20 registrations / 40 OTP verifications across a shared office/carrier IP", async () => {
    delete process.env.RATE_LIMIT_PROVIDER;
    const sharedCarrierIp = "198.51.100.88";
    await authRegisterLimiter.reset(`ip:${sharedCarrierIp}`);
    await otpVerifyLimiter.reset(`ip:${sharedCarrierIp}`);

    // User A exhausts their 5/15m per-email registration limit on sharedCarrierIp
    const userA = "user-a@campus.edu";
    await authRegisterLimiter.reset(`email:${userA}`);
    for (let i = 0; i < 5; i++) {
      expect((await authRegisterLimiter.check(`ip:${sharedCarrierIp}`)).success).toBe(true);
      expect((await authRegisterLimiter.check(`email:${userA}`)).success).toBe(true);
    }
    expect((await authRegisterLimiter.check(`email:${userA}`)).success).toBe(false);

    // User B on the SAME shared IP can still register because IP ceiling is 20/15m
    const userB = "user-b@campus.edu";
    await authRegisterLimiter.reset(`email:${userB}`);
    expect((await authRegisterLimiter.check(`ip:${sharedCarrierIp}`)).success).toBe(true);
    expect((await authRegisterLimiter.check(`email:${userB}`)).success).toBe(true);
  });
});
