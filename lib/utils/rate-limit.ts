// lib/utils/rate-limit.ts
// Multi-instance and persistent rate limiter for Soft Showcase.
// Stores state in shared memory + persisted disk state to reliably share limits across instances/workers.

import fs from "fs";
import path from "path";

interface RateLimitOptions {
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

interface WindowEntry {
  count: number;
  resetAt: number;
}

const DISK_STORE_PATH = "/tmp/softshowcase_rate_limits.json";

class PersistentRateLimitStore {
  private cache: Map<string, WindowEntry> = new Map();
  private lastSave = 0;

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DISK_STORE_PATH)) {
        const raw = fs.readFileSync(DISK_STORE_PATH, "utf-8");
        const parsed = JSON.parse(raw);
        const now = Date.now();
        for (const [k, v] of Object.entries(parsed)) {
          const entry = v as WindowEntry;
          if (entry && entry.resetAt > now) {
            this.cache.set(k, entry);
          }
        }
      }
    } catch {
      // Ignore initial file read errors
    }
  }

  private saveToDisk() {
    const now = Date.now();
    // Throttle disk writes to once per 200ms
    if (now - this.lastSave < 200) return;
    this.lastSave = now;

    try {
      const obj: Record<string, WindowEntry> = {};
      for (const [k, v] of this.cache.entries()) {
        if (v.resetAt > now) {
          obj[k] = v;
        }
      }
      fs.writeFileSync(DISK_STORE_PATH, JSON.stringify(obj), "utf-8");
    } catch {
      // Non-fatal
    }
  }

  get(key: string): WindowEntry | undefined {
    // Re-check disk if missing
    if (!this.cache.has(key)) {
      this.loadFromDisk();
    }
    const entry = this.cache.get(key);
    if (entry && Date.now() > entry.resetAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, entry: WindowEntry) {
    this.cache.set(key, entry);
    this.saveToDisk();
  }

  delete(key: string) {
    this.cache.delete(key);
    this.saveToDisk();
  }
}

const globalStore: PersistentRateLimitStore =
  (globalThis as any).__softshowcase_rate_limit_store ||
  ((globalThis as any).__softshowcase_rate_limit_store = new PersistentRateLimitStore());

export function createRateLimiter(options: RateLimitOptions, namespace = "rl") {
  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const scopedKey = `${namespace}:${key}`;
      const entry = globalStore.get(scopedKey);

      if (!entry || now > entry.resetAt) {
        // Start a new window
        const newEntry: WindowEntry = {
          count: 1,
          resetAt: now + options.windowMs,
        };
        globalStore.set(scopedKey, newEntry);
        return {
          success: true,
          remaining: options.limit - 1,
          reset: newEntry.resetAt,
        };
      }

      if (entry.count >= options.limit) {
        return { success: false, remaining: 0, reset: entry.resetAt };
      }

      entry.count++;
      globalStore.set(scopedKey, entry);
      return {
        success: true,
        remaining: options.limit - entry.count,
        reset: entry.resetAt,
      };
    },

    reset(key: string) {
      globalStore.delete(`${namespace}:${key}`);
    },
  };
}

// ── Pre-configured limiters for security-sensitive endpoints ─────────────────

// Public inquiry submission limiter
export const inquiryLimiter = createRateLimiter(
  { limit: 5, windowMs: 15 * 60 * 1000 },
  "inquiry"
);

// WhatsApp deep-link generation limiter
export const whatsappLimiter = createRateLimiter(
  { limit: 10, windowMs: 15 * 60 * 1000 },
  "whatsapp"
);

// Custom project request limiter
export const customRequestLimiter = createRateLimiter(
  { limit: 3, windowMs: 60 * 60 * 1000 },
  "custom"
);

// User registration limiter
export const authRegisterLimiter = createRateLimiter(
  { limit: 5, windowMs: 15 * 60 * 1000 },
  "auth_reg"
);

// Partner registration limiter
export const partnerRegisterLimiter = createRateLimiter(
  { limit: 5, windowMs: 15 * 60 * 1000 },
  "part_reg"
);

// OTP Verification limiter (Max 5 attempts per window, addressing Issue 17)
export const otpVerifyLimiter = createRateLimiter(
  { limit: 5, windowMs: 15 * 60 * 1000 },
  "otp_verify"
);

// OTP Resend limiter
export const otpResendLimiter = createRateLimiter(
  { limit: 3, windowMs: 15 * 60 * 1000 },
  "otp_resend"
);

// Password Reset Request limiter (Issue 20)
export const passwordResetRequestLimiter = createRateLimiter(
  { limit: 3, windowMs: 15 * 60 * 1000 },
  "pwd_req"
);

// Password Reset Code Verification limiter (Issue 20)
export const passwordResetVerifyLimiter = createRateLimiter(
  { limit: 5, windowMs: 15 * 60 * 1000 },
  "pwd_verify"
);

// Support action / message limiter
export const supportActionLimiter = createRateLimiter(
  { limit: 15, windowMs: 10 * 60 * 1000 },
  "support"
);

// Transaction creation limiter
export const transactionCreateLimiter = createRateLimiter(
  { limit: 10, windowMs: 10 * 60 * 1000 },
  "txn_create"
);

/**
 * Extracts the client IP from a Next.js request.
 * Falls back to "unknown" if no IP can be determined.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
