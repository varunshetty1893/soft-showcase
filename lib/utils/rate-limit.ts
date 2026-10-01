// lib/utils/rate-limit.ts
// Production-grade Rate Limiter for Soft Showcase.
// - Production / Vercel Serverless: Upstash Redis (@upstash/ratelimit) distributed rate limiting.
// - Development & Test: Isolated in-memory fallback.
// - Strict IP derivation: x-vercel-forwarded-for -> x-real-ip -> x-forwarded-for (len - TRUSTED_PROXY_COUNT).
// - Fingerprint fallback: sha256(user-agent + accept-language) when no valid IP is derivable.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

export interface RateLimitOptions {
  /** Maximum number of requests per window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
  /**
   * Failure mode when the backing store (e.g. Upstash) throws an error:
   * - "closed": rejects the request with success: false (for auth, registration, OTP, password reset)
   * - "open": allows the request with a warning log (for general inquiries, WhatsApp link generation)
   * Default: "open"
   */
  failMode?: "open" | "closed";
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // Unix timestamp (ms) when the window resets
  error?: boolean; // True if backing store experienced an outage/exception
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

// ── In-Memory Store (Active in Development/Test) ──────────────────────────────
class InMemoryRateLimitStore {
  private cache: Map<string, WindowEntry> = new Map();

  get(key: string): WindowEntry | undefined {
    const entry = this.cache.get(key);
    if (entry && Date.now() > entry.resetAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, entry: WindowEntry): void {
    this.cache.set(key, entry);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Singleton memory store across module reloads in development
const globalMemoryStore: InMemoryRateLimitStore =
  (globalThis as any).__softshowcase_memory_rate_limit_store ||
  ((globalThis as any).__softshowcase_memory_rate_limit_store = new InMemoryRateLimitStore());

// Shared Redis client singleton for connection pooling
let sharedRedis: Redis | null = null;
function getSharedRedis(): Redis | null {
  if (sharedRedis) return sharedRedis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    sharedRedis = new Redis({ url, token });
    return sharedRedis;
  } catch (err) {
    console.warn("[RateLimit] Failed to initialize Upstash Redis client:", err);
    return null;
  }
}

export interface RateLimiterInstance {
  check(key: string): Promise<RateLimitResult>;
  limit(key: string): Promise<RateLimitResult>;
  reset(key: string): Promise<void>;
}

/**
 * Creates an async-only rate limiter instance.
 * Production uses Upstash Redis without dual-counting memory counters.
 * Development / Test uses isolated in-memory sliding window.
 */
export function createRateLimiter(options: RateLimitOptions, namespace = "rl"): RateLimiterInstance {
  const isProduction = process.env.NODE_ENV === "production";
  const redis = getSharedRedis();
  const failMode = options.failMode || "open";

  // Use Upstash if redis credentials exist and either in production or explicitly forced
  const shouldUseUpstash =
    Boolean(redis) && (isProduction || process.env.RATE_LIMIT_PROVIDER === "upstash");

  let upstashRatelimit: Ratelimit | null = null;
  if (shouldUseUpstash && redis) {
    try {
      upstashRatelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(options.limit, `${options.windowMs} ms`),
        prefix: `softshowcase:${namespace}`,
        ephemeralCache: new Map(),
      });
    } catch (err) {
      console.warn(`[RateLimit] Failed to create Upstash Ratelimit for ${namespace}:`, err);
    }
  }

  function checkInMemory(key: string): RateLimitResult {
    const now = Date.now();
    const scopedKey = `${namespace}:${key}`;
    const entry = globalMemoryStore.get(scopedKey);

    if (!entry || now > entry.resetAt) {
      const newEntry: WindowEntry = {
        count: 1,
        resetAt: now + options.windowMs,
      };
      globalMemoryStore.set(scopedKey, newEntry);
      return {
        success: true,
        remaining: Math.max(0, options.limit - 1),
        reset: newEntry.resetAt,
      };
    }

    if (entry.count >= options.limit) {
      return {
        success: false,
        remaining: 0,
        reset: entry.resetAt,
      };
    }

    entry.count++;
    globalMemoryStore.set(scopedKey, entry);
    return {
      success: true,
      remaining: Math.max(0, options.limit - entry.count),
      reset: entry.resetAt,
    };
  }

  return {
    async check(key: string): Promise<RateLimitResult> {
      // 1. In development / testing without Upstash, use isolated memory store
      if (!upstashRatelimit) {
        return checkInMemory(key);
      }

      // 2. In production with Upstash, query Redis directly (no double-counting memory store!)
      try {
        const res = await upstashRatelimit.limit(key);
        return {
          success: res.success,
          remaining: res.remaining,
          reset: res.reset,
        };
      } catch (err) {
        console.warn(`[RateLimit] Upstash error on ${namespace}:${key}:`, err);

        // Fail-closed for security-critical limiters (auth, OTP, registration)
        if (failMode === "closed") {
          return {
            success: false,
            remaining: 0,
            reset: Date.now() + options.windowMs,
            error: true,
          };
        }

        // Fail-open with warning log for non-critical customer routes
        return {
          success: true,
          remaining: 1,
          reset: Date.now() + options.windowMs,
          error: true,
        };
      }
    },

    async limit(key: string): Promise<RateLimitResult> {
      return this.check(key);
    },

    async reset(key: string): Promise<void> {
      const scopedKey = `${namespace}:${key}`;
      globalMemoryStore.delete(scopedKey);

      if (redis) {
        try {
          await redis.del(`softshowcase:${namespace}:${key}`);
        } catch {
          // Non-fatal
        }
      }
    },
  };
}

// ── Pre-configured Limiters ──────────────────────────────────────────────────

// Public inquiry submission limiter (5 requests per 15 minutes, fail-open)
export const inquiryLimiter = createRateLimiter(
  { limit: 5, windowMs: 15 * 60 * 1000, failMode: "open" },
  "inquiry"
);

// WhatsApp deep-link generation limiter (10 requests per 15 minutes, fail-open)
export const whatsappLimiter = createRateLimiter(
  { limit: 10, windowMs: 15 * 60 * 1000, failMode: "open" },
  "whatsapp"
);

// Custom project request limiter (3 requests per 60 minutes, fail-open)
export const customRequestLimiter = createRateLimiter(
  { limit: 3, windowMs: 60 * 60 * 1000, failMode: "open" },
  "custom"
);

// User registration limiter (5 requests per 15 minutes, fail-closed)
export const authRegisterLimiter = createRateLimiter(
  { limit: 5, windowMs: 15 * 60 * 1000, failMode: "closed" },
  "auth_reg"
);

// Partner registration limiter (5 requests per 15 minutes, fail-closed)
export const partnerRegisterLimiter = createRateLimiter(
  { limit: 5, windowMs: 15 * 60 * 1000, failMode: "closed" },
  "part_reg"
);

// OTP Verification limiter (Max 5 attempts per window, fail-closed)
export const otpVerifyLimiter = createRateLimiter(
  { limit: 5, windowMs: 15 * 60 * 1000, failMode: "closed" },
  "otp_verify"
);

// OTP Resend limiter (3 requests per 15 minutes, fail-closed)
export const otpResendLimiter = createRateLimiter(
  { limit: 3, windowMs: 15 * 60 * 1000, failMode: "closed" },
  "otp_resend"
);

// Password Reset Request limiter (3 requests per 15 minutes, fail-closed)
export const passwordResetRequestLimiter = createRateLimiter(
  { limit: 3, windowMs: 15 * 60 * 1000, failMode: "closed" },
  "pwd_req"
);

// Password Reset Code Verification limiter (5 attempts per 15 minutes, fail-closed)
export const passwordResetVerifyLimiter = createRateLimiter(
  { limit: 5, windowMs: 15 * 60 * 1000, failMode: "closed" },
  "pwd_verify"
);

// Support action / message limiter (15 requests per 10 minutes, fail-open)
export const supportActionLimiter = createRateLimiter(
  { limit: 15, windowMs: 10 * 60 * 1000, failMode: "open" },
  "support"
);

// Transaction creation limiter (10 requests per 10 minutes, fail-closed)
export const transactionCreateLimiter = createRateLimiter(
  { limit: 10, windowMs: 10 * 60 * 1000, failMode: "closed" },
  "txn_create"
);

// Credentials login limiter (Max 5 attempts per 15 minutes by IP and by Email, fail-closed)
export const authLoginLimiter = createRateLimiter(
  { limit: 5, windowMs: 15 * 60 * 1000, failMode: "closed" },
  "auth_login"
);
export const loginLimiter = authLoginLimiter;

// ── Anti-Spam & Relay Defense Limiters (M4) ──────────────────────────────────
// Max 3 messages/inquiries per recipient email per hour
export const recipientEmailLimiter = createRateLimiter(
  { limit: 3, windowMs: 60 * 60 * 1000, failMode: "closed" },
  "rcpt_limit"
);

// Max 5 inquiries per project per IP per hour
export const projectIpLimiter = createRateLimiter(
  { limit: 5, windowMs: 60 * 60 * 1000, failMode: "closed" },
  "proj_ip_limit"
);

// Global daily cap on outbound transactional emails (500/day)
export const dailyOutboundEmailLimiter = createRateLimiter(
  { limit: 500, windowMs: 24 * 60 * 60 * 1000, failMode: "open" },
  "daily_email_cap"
);

// ── IP & Fingerprint Extraction (M2) ─────────────────────────────────────────

function getTrustedProxyCount(): number {
  const envVal = process.env.TRUSTED_PROXY_COUNT;
  if (!envVal) return 1;
  const parsed = parseInt(envVal, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1;
}

/**
 * Extracts client IP or client fingerprint using trusted proxy chain.
 * Order of preference:
 * 1. x-vercel-forwarded-for (Vercel edge trusted platform header)
 * 2. x-real-ip
 * 3. x-forwarded-for: parsed as comma-separated list, taking entry at index:
 *    Math.max(0, parts.length - trustedProxyCount)
 *    NEVER the leftmost entry which can be client-spoofed!
 * 4. Fallback: hash of User-Agent + Accept-Language in a stricter prefix bucket (e.g. `fp_${hash}`)
 */
export function extractClientIpOrFingerprint(headers: { get(name: string): string | null }): string {
  // 1. Platform-set header on Vercel
  const vercelIp = headers.get("x-vercel-forwarded-for");
  if (vercelIp) {
    const candidate = vercelIp.split(",")[0]?.trim();
    if (candidate && candidate !== "unknown") return candidate;
  }

  // 2. Trusted real IP from reverse proxy
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    const candidate = realIp.trim();
    if (candidate && candidate !== "unknown") return candidate;
  }

  // 3. x-forwarded-for: inspect proxy hops using TRUSTED_PROXY_COUNT
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const hops = xForwardedFor
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0 && p !== "unknown");

    if (hops.length > 0) {
      const proxyCount = getTrustedProxyCount();
      // Target hop from the right: hops.length - proxyCount
      const targetIndex = Math.max(0, hops.length - proxyCount);
      const chosenIp = hops[targetIndex];
      if (chosenIp) return chosenIp;
    }
  }

  // 4. Stricter fallback bucket: hash User-Agent + Accept-Language
  const userAgent = headers.get("user-agent") || "";
  const acceptLanguage = headers.get("accept-language") || "";

  if (userAgent || acceptLanguage) {
    const hash = crypto
      .createHash("sha256")
      .update(`${userAgent}|${acceptLanguage}`)
      .digest("hex")
      .slice(0, 16);
    return `fp_${hash}`;
  }

  return "127.0.0.1";
}

/**
 * Single entry point for extracting client IP / identifier in Next.js.
 * Inspects the request headers, or falls back to next/headers context.
 */
export async function getRequestIp(request?: Request | null): Promise<string> {
  if (request && "headers" in request) {
    return extractClientIpOrFingerprint(request.headers);
  }

  try {
    const { headers } = await import("next/headers");
    const headerList = await headers();
    return extractClientIpOrFingerprint(headerList);
  } catch {
    // Non-fatal if next/headers is called outside request scope
  }

  return "127.0.0.1";
}

/**
 * Backward-compatible synchronous wrapper around extractClientIpOrFingerprint.
 */
export function getClientIp(request?: Request | null): string {
  if (!request || !("headers" in request)) return "127.0.0.1";
  return extractClientIpOrFingerprint(request.headers);
}
