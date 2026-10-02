// lib/utils/rate-limit.ts
// Production-grade Rate Limiter for Soft Showcase.
// - Production / Vercel Serverless: Upstash Redis (@upstash/ratelimit) distributed rate limiting (mandatory in production runtime - N4).
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

// ── In-Memory Store (Active in Development/Test ONLY — N4) ────────────────────
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

// Singleton memory store across module reloads in development/test
const globalMemoryStore: InMemoryRateLimitStore =
  (globalThis as unknown as { __softshowcase_memory_rate_limit_store?: InMemoryRateLimitStore })
    .__softshowcase_memory_rate_limit_store ||
  ((
    globalThis as unknown as { __softshowcase_memory_rate_limit_store?: InMemoryRateLimitStore }
  ).__softshowcase_memory_rate_limit_store = new InMemoryRateLimitStore());

// Shared Redis client helper
let sharedRedis: Redis | null = null;
let sharedRedisCredentialsKey = "";

function getSharedRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  const credKey = `${url}|${token}`;
  if (sharedRedis && sharedRedisCredentialsKey === credKey) {
    return sharedRedis;
  }

  try {
    sharedRedis = new Redis({ url, token });
    sharedRedisCredentialsKey = credKey;
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

function isProductionRuntime(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const isBuildPhase =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build";
  return !isBuildPhase;
}

/**
 * Creates an async-only rate limiter instance.
 * - Production runtime requires Upstash Redis and throws if credentials are missing (N4).
 * - Development / Test uses isolated in-memory sliding window unless Upstash is forced.
 * - reset(key) invokes upstashRatelimit.resetUsedTokens(key) (with SCAN+DEL fallback) and clears memory store (N7).
 */
export function createRateLimiter(options: RateLimitOptions, namespace = "rl"): RateLimiterInstance {
  const failMode = options.failMode || "open";
  let upstashRatelimit: Ratelimit | null = null;
  let upstashCredKey = "";

  function getOrInitUpstash(): { ratelimit: Ratelimit | null; redis: Redis | null } {
    const isProd = isProductionRuntime();
    const redis = getSharedRedis();

    if (isProd && !redis) {
      throw new Error(
        "[RateLimit] Production error: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production runtime."
      );
    }

    const shouldUseUpstash =
      Boolean(redis) && (isProd || process.env.RATE_LIMIT_PROVIDER === "upstash");

    if (!shouldUseUpstash || !redis) {
      return { ratelimit: null, redis: null };
    }

    const currentCredKey = `${process.env.UPSTASH_REDIS_REST_URL}|${process.env.UPSTASH_REDIS_REST_TOKEN}`;
    if (!upstashRatelimit || upstashCredKey !== currentCredKey) {
      try {
        upstashRatelimit = new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(options.limit, `${options.windowMs} ms`),
          prefix: `softshowcase:${namespace}`,
          ephemeralCache: new Map(),
        });
        upstashCredKey = currentCredKey;
      } catch (err) {
        console.warn(`[RateLimit] Failed to create Upstash Ratelimit for ${namespace}:`, err);
      }
    }

    return { ratelimit: upstashRatelimit, redis };
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
      const { ratelimit } = getOrInitUpstash();

      // 1. In development / test without Upstash, use isolated memory store
      if (!ratelimit) {
        return checkInMemory(key);
      }

      // 2. Query Upstash Redis directly
      try {
        const res = await ratelimit.limit(key);
        return {
          success: res.success,
          remaining: res.remaining,
          reset: res.reset,
        };
      } catch (err) {
        console.warn(`[RateLimit] Upstash error on ${namespace}:${key}:`, err);

        if (failMode === "closed") {
          return {
            success: false,
            remaining: 0,
            reset: Date.now() + options.windowMs,
            error: true,
          };
        }

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

      let ratelimit: Ratelimit | null = null;
      let redis: Redis | null = null;
      try {
        const init = getOrInitUpstash();
        ratelimit = init.ratelimit;
        redis = init.redis;
      } catch {
        // Ignore if not configured in dev/test
      }

      if (ratelimit && typeof (ratelimit as unknown as { resetUsedTokens?: (k: string) => Promise<void> }).resetUsedTokens === "function") {
        try {
          await (ratelimit as unknown as { resetUsedTokens: (k: string) => Promise<void> }).resetUsedTokens(key);
          return;
        } catch (err) {
          console.warn(`[RateLimit] resetUsedTokens failed for ${namespace}:${key}:`, err);
        }
      }

      if (redis) {
        try {
          let cursor = "0";
          const pattern = `softshowcase:${namespace}:${key}*`;
          do {
            const scanResult = await redis.scan(cursor, { match: pattern, count: 100 });
            const nextCursor = String(scanResult[0]);
            const keys = scanResult[1];
            if (Array.isArray(keys) && keys.length > 0) {
              await redis.del(...keys);
            }
            cursor = nextCursor;
          } while (cursor !== "0");
        } catch {
          // Non-fatal
        }
      }
    },
  };
}

/**
 * Helper to create a two-key (or multi-key) composite rate limiter that dispatches
 * `ip:*` keys to a generous shared-IP ceiling and email/pair keys to strict buckets (N8 & N9).
 */
function createKeyedCompositeLimiter(
  ipLimiter: RateLimiterInstance,
  emailLimiter: RateLimiterInstance,
  emailIpLimiter?: RateLimiterInstance
): RateLimiterInstance {
  function selectLimiter(key: string): RateLimiterInstance {
    if (emailIpLimiter && key.startsWith("email_ip:")) {
      return emailIpLimiter;
    }
    if (key.startsWith("ip:")) {
      return ipLimiter;
    }
    return emailLimiter;
  }

  return {
    async check(key: string): Promise<RateLimitResult> {
      return selectLimiter(key).check(key);
    },
    async limit(key: string): Promise<RateLimitResult> {
      return selectLimiter(key).limit(key);
    },
    async reset(key: string): Promise<void> {
      return selectLimiter(key).reset(key);
    },
  };
}

// ── Rate Limiter Policy Table (N2, N3, N8, N9) ───────────────────────────────
//
// | Endpoint / Action         | Per-IP Ceiling    | Per-Email / Pair Limit              | Fail Mode |
// |---------------------------|-------------------|-------------------------------------|-----------|
// | Credentials Login (N8)    | 30 / 15 min       | 5 / 15 min (email+IP), 25 / 15m (email) | closed |
// | User Register (N9)        | 20 / 15 min       | 5 / 15 min (email)                  | closed    |
// | OTP Verify (N9)           | 40 / 15 min       | 5 / 15 min (email)                  | closed    |
// | OTP Resend (N9)           | 20 / 15 min       | 3 / 15 min (email)                  | closed    |
// | Password Reset Req (N9)   | 15 / 15 min       | 3 / 15 min (email)                  | closed    |
// | Password Reset Verify (N9)| 40 / 15 min       | 5 / 15 min (email)                  | closed    |
// | Partner Register (N9)     | 15 / 15 min       | 5 / 15 min (email)                  | closed    |
// | Provider Inquiry (N2)     | 3 / hr (prov+IP)  | 3 / day (prov+email), 40/hr (burst) | closed/open|
// | Outbound Email Cap (N3)   | 500 / 24 hr (global transactional email cap)             | open      |
// ─────────────────────────────────────────────────────────────────────────────

const FIFTEEN_MIN_MS = 15 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Public inquiry submission limiter (5 requests per 15 minutes per IP, fail-open)
export const inquiryLimiter = createRateLimiter(
  { limit: 5, windowMs: FIFTEEN_MIN_MS, failMode: "open" },
  "inquiry"
);

// WhatsApp deep-link generation limiter (10 requests per 15 minutes, fail-open)
export const whatsappLimiter = createRateLimiter(
  { limit: 10, windowMs: FIFTEEN_MIN_MS, failMode: "open" },
  "whatsapp"
);

// Custom project request limiter (3 requests per 60 minutes per IP, fail-open)
export const customRequestLimiter = createRateLimiter(
  { limit: 3, windowMs: ONE_HOUR_MS, failMode: "open" },
  "custom"
);

// Custom project request per-email limiter (3 requests per 24 hours, fail-closed — dedicated namespace, N2)
export const customRequestEmailLimiter = createRateLimiter(
  { limit: 3, windowMs: ONE_DAY_MS, failMode: "closed" },
  "custom_email"
);

// Custom project request global burst limiter (40 per hour, fail-open — dedicated namespace, N2)
export const customRequestBurstLimiter = createRateLimiter(
  { limit: 40, windowMs: ONE_HOUR_MS, failMode: "open" },
  "custom_burst"
);

// ── N9: User Registration Limiters (IP: 20/15m, Email: 5/15m) ─────────────────
export const authRegisterIpLimiter = createRateLimiter(
  { limit: 20, windowMs: FIFTEEN_MIN_MS, failMode: "closed" },
  "auth_reg_ip"
);
export const authRegisterEmailLimiter = createRateLimiter(
  { limit: 5, windowMs: FIFTEEN_MIN_MS, failMode: "closed" },
  "auth_reg_email"
);
export const authRegisterLimiter = createKeyedCompositeLimiter(
  authRegisterIpLimiter,
  authRegisterEmailLimiter
);

// ── N9: Partner Registration Limiters (IP: 15/15m, Email: 5/15m) ──────────────
export const partnerRegisterIpLimiter = createRateLimiter(
  { limit: 15, windowMs: FIFTEEN_MIN_MS, failMode: "closed" },
  "part_reg_ip"
);
export const partnerRegisterEmailLimiter = createRateLimiter(
  { limit: 5, windowMs: FIFTEEN_MIN_MS, failMode: "closed" },
  "part_reg_email"
);
export const partnerRegisterLimiter = createKeyedCompositeLimiter(
  partnerRegisterIpLimiter,
  partnerRegisterEmailLimiter
);

// ── N9: OTP Verification Limiters (IP: 40/15m, Email: 5/15m) ──────────────────
export const otpVerifyIpLimiter = createRateLimiter(
  { limit: 40, windowMs: FIFTEEN_MIN_MS, failMode: "closed" },
  "otp_verify_ip"
);
export const otpVerifyEmailLimiter = createRateLimiter(
  { limit: 5, windowMs: FIFTEEN_MIN_MS, failMode: "closed" },
  "otp_verify_email"
);
export const otpVerifyLimiter = createKeyedCompositeLimiter(
  otpVerifyIpLimiter,
  otpVerifyEmailLimiter
);

// ── N9: OTP Resend Limiters (IP: 20/15m, Email: 3/15m) ────────────────────────
export const otpResendIpLimiter = createRateLimiter(
  { limit: 20, windowMs: FIFTEEN_MIN_MS, failMode: "closed" },
  "otp_resend_ip"
);
export const otpResendEmailLimiter = createRateLimiter(
  { limit: 3, windowMs: FIFTEEN_MIN_MS, failMode: "closed" },
  "otp_resend_email"
);
export const otpResendLimiter = createKeyedCompositeLimiter(
  otpResendIpLimiter,
  otpResendEmailLimiter
);

// ── N9: Password Reset Request Limiters (IP: 15/15m, Email: 3/15m) ────────────
export const passwordResetRequestIpLimiter = createRateLimiter(
  { limit: 15, windowMs: FIFTEEN_MIN_MS, failMode: "closed" },
  "pwd_req_ip"
);
export const passwordResetRequestEmailLimiter = createRateLimiter(
  { limit: 3, windowMs: FIFTEEN_MIN_MS, failMode: "closed" },
  "pwd_req_email"
);
export const passwordResetRequestLimiter = createKeyedCompositeLimiter(
  passwordResetRequestIpLimiter,
  passwordResetRequestEmailLimiter
);

// ── N9: Password Reset Verify Limiters (IP: 40/15m, Email: 5/15m) ─────────────
export const passwordResetVerifyIpLimiter = createRateLimiter(
  { limit: 40, windowMs: FIFTEEN_MIN_MS, failMode: "closed" },
  "pwd_verify_ip"
);
export const passwordResetVerifyEmailLimiter = createRateLimiter(
  { limit: 5, windowMs: FIFTEEN_MIN_MS, failMode: "closed" },
  "pwd_verify_email"
);
export const passwordResetVerifyLimiter = createKeyedCompositeLimiter(
  passwordResetVerifyIpLimiter,
  passwordResetVerifyEmailLimiter
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

// ── N8: Credentials Login Limiters (IP: 30/15m, Email+IP: 5/15m, Email: 25/15m)
export const authLoginIpLimiter = createRateLimiter(
  { limit: 30, windowMs: FIFTEEN_MIN_MS, failMode: "closed" },
  "auth_login_ip"
);
export const authLoginEmailIpLimiter = createRateLimiter(
  { limit: 5, windowMs: FIFTEEN_MIN_MS, failMode: "closed" },
  "auth_login_email_ip"
);
export const authLoginEmailLimiter = createRateLimiter(
  { limit: 25, windowMs: FIFTEEN_MIN_MS, failMode: "closed" },
  "auth_login_email"
);
export const authLoginLimiter = createKeyedCompositeLimiter(
  authLoginIpLimiter,
  authLoginEmailLimiter,
  authLoginEmailIpLimiter
);
export const loginLimiter = authLoginLimiter;

// ── N2: Three-Layer Provider Lead Protection ─────────────────────────────────
// Layer 1: per provider + client (IP/fingerprint): 3/hour (stops one abuser)
export const providerClientLimiter = createRateLimiter(
  { limit: 3, windowMs: ONE_HOUR_MS, failMode: "closed" },
  "prov_client"
);

// Layer 2: per customer email + provider: 3/day (stops repeat spam from same email)
export const providerCustomerEmailLimiter = createRateLimiter(
  { limit: 3, windowMs: ONE_DAY_MS, failMode: "closed" },
  "prov_cust_email"
);

// Layer 3: per provider global: 40/hour (burst safety — does NOT reject customer; throttles email only)
export const providerGlobalBurstLimiter = createRateLimiter(
  { limit: 40, windowMs: ONE_HOUR_MS, failMode: "open" },
  "prov_global_burst"
);

// Legacy alias kept for backward compatibility in imports
export const recipientEmailLimiter = providerClientLimiter;

// Max 5 inquiries per project per IP per hour
export const projectIpLimiter = createRateLimiter(
  { limit: 5, windowMs: ONE_HOUR_MS, failMode: "closed" },
  "proj_ip_limit"
);

// ── N3: Global Daily Cap on Outbound Transactional Emails (500/day) ──────────
export const dailyOutboundEmailLimiter = createRateLimiter(
  { limit: 500, windowMs: ONE_DAY_MS, failMode: "open" },
  "daily_email_cap"
);

/**
 * Consumes the daily outbound transactional email limiter once per email sent (N3).
 * Returns true if the email may be sent, or false if the daily cap has been reached.
 */
export async function canSendEmail(): Promise<boolean> {
  const res = await dailyOutboundEmailLimiter.check("global_daily_email");
  if (!res.success) {
    console.error(
      "[ALERT][EmailCap] Daily outbound transactional email cap (500/day) reached. Skipping email dispatch and marking notificationStatus=THROTTLED."
    );
    return false;
  }
  return true;
}

// ── IP & Fingerprint Extraction (M2) ─────────────────────────────────────────

function getTrustedProxyCount(): number {
  const envVal = process.env.TRUSTED_PROXY_COUNT;
  if (!envVal) return 1;
  const parsed = parseInt(envVal, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1;
}

/**
 * Extracts client IP or client fingerprint using trusted proxy chain.
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
