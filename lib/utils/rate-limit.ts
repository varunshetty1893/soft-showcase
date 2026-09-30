// lib/utils/rate-limit.ts
// Production-grade Rate Limiter for Soft Showcase.
// - Production / Vercel Serverless: Upstash Redis (@upstash/ratelimit) distributed rate limiting.
// - Development: In-memory fallback (no disk or /tmp storage).
// - Graceful Fallback: If Upstash credentials are not supplied or fail, smoothly falls back to memory.

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitOptions {
  /** Maximum number of requests per window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // Unix timestamp (ms) when the window resets
}

export type RateLimitReturn = Promise<RateLimitResult> & RateLimitResult;

interface WindowEntry {
  count: number;
  resetAt: number;
}

// ── In-Memory Store (Active in Development or as Graceful Fallback) ───────────
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

// Keep singleton across module reloads in development
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

/**
 * Creates a rate limiter instance with Upstash Redis in production and in-memory fallback in development.
 */
export function createRateLimiter(options: RateLimitOptions, namespace = "rl") {
  const isDevelopment = process.env.NODE_ENV === "development";
  const redis = getSharedRedis();

  // In development, fall back to in-memory unless explicitly forced via RATE_LIMIT_PROVIDER=upstash
  const shouldUseUpstash =
    Boolean(redis) && (!isDevelopment || process.env.RATE_LIMIT_PROVIDER === "upstash");

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
    /**
     * Checks rate limit for the given key.
     * Returns a hybrid object that can be awaited (`await limiter.check(key)`)
     * or read synchronously (`limiter.check(key).success`) for maximum route compatibility.
     */
    check(key: string): RateLimitReturn {
      const memResult = checkInMemory(key);

      // If Upstash is not active (dev or unconfigured), resolve with in-memory result
      if (!upstashRatelimit) {
        const promise = Promise.resolve(memResult);
        Object.assign(promise, memResult);
        return promise as RateLimitReturn;
      }

      // Query Upstash Redis with fallback to in-memory on error
      const asyncCheck = async (): Promise<RateLimitResult> => {
        try {
          const res = await upstashRatelimit!.limit(key);
          return {
            success: res.success,
            remaining: res.remaining,
            reset: res.reset,
          };
        } catch (err) {
          console.warn(`[RateLimit] Upstash limit error for ${namespace}:${key}, falling back to memory:`, err);
          return memResult;
        }
      };

      const promise = asyncCheck();
      Object.assign(promise, memResult);
      return promise as RateLimitReturn;
    },

    /**
     * Resets the rate limit for the given key.
     */
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

    /**
     * Alias for .check(key) matching @upstash/ratelimit native API.
     */
    limit(key: string): RateLimitReturn {
      return this.check(key);
    },
  };
}

// ── Pre-configured limiters for security-sensitive endpoints ─────────────────

// Public inquiry submission limiter (5 requests per 15 minutes)
export const inquiryLimiter = createRateLimiter(
  { limit: 5, windowMs: 15 * 60 * 1000 },
  "inquiry"
);

// WhatsApp deep-link generation limiter (10 requests per 15 minutes)
export const whatsappLimiter = createRateLimiter(
  { limit: 10, windowMs: 15 * 60 * 1000 },
  "whatsapp"
);

// Custom project request limiter (3 requests per 60 minutes)
export const customRequestLimiter = createRateLimiter(
  { limit: 3, windowMs: 60 * 60 * 1000 },
  "custom"
);

// User registration limiter (5 requests per 15 minutes)
export const authRegisterLimiter = createRateLimiter(
  { limit: 5, windowMs: 15 * 60 * 1000 },
  "auth_reg"
);

// Partner registration limiter (5 requests per 15 minutes)
export const partnerRegisterLimiter = createRateLimiter(
  { limit: 5, windowMs: 15 * 60 * 1000 },
  "part_reg"
);

// OTP Verification limiter (Max 5 attempts per window, addressing Issue 17)
export const otpVerifyLimiter = createRateLimiter(
  { limit: 5, windowMs: 15 * 60 * 1000 },
  "otp_verify"
);

// OTP Resend limiter (3 requests per 15 minutes)
export const otpResendLimiter = createRateLimiter(
  { limit: 3, windowMs: 15 * 60 * 1000 },
  "otp_resend"
);

// Password Reset Request limiter (3 requests per 15 minutes)
export const passwordResetRequestLimiter = createRateLimiter(
  { limit: 3, windowMs: 15 * 60 * 1000 },
  "pwd_req"
);

// Password Reset Code Verification limiter (5 attempts per 15 minutes)
export const passwordResetVerifyLimiter = createRateLimiter(
  { limit: 5, windowMs: 15 * 60 * 1000 },
  "pwd_verify"
);

// Support action / message limiter (15 requests per 10 minutes)
export const supportActionLimiter = createRateLimiter(
  { limit: 15, windowMs: 10 * 60 * 1000 },
  "support"
);

// Transaction creation limiter (10 requests per 10 minutes)
export const transactionCreateLimiter = createRateLimiter(
  { limit: 10, windowMs: 10 * 60 * 1000 },
  "txn_create"
);

// Credentials login limiter (Max 5 attempts per 15 minutes by IP and by Email)
export const authLoginLimiter = createRateLimiter(
  { limit: 5, windowMs: 15 * 60 * 1000 },
  "auth_login"
);
export const loginLimiter = authLoginLimiter;

/**
 * Extracts the client IP from a Next.js request.
 * Falls back to "unknown" if no IP can be determined.
 */
export function getClientIp(request?: Request | null): string {
  if (!request) return "unknown";
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
    return request.headers.get("x-real-ip") ?? "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Extracts the client IP from the request or via Next.js next/headers.
 */
export async function getRequestIp(request?: Request | null): Promise<string> {
  const ip = getClientIp(request);
  if (ip && ip !== "unknown") return ip;

  try {
    const { headers } = await import("next/headers");
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
    const realIp = headerList.get("x-real-ip");
    if (realIp) return realIp.trim();
  } catch {
    // Non-fatal if next/headers is not in request context
  }

  return "127.0.0.1";
}
