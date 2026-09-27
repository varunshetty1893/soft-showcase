// lib/utils/rate-limit.ts
// Simple in-memory rate limiter for development and small deployments.
// For production, replace with an Upstash Redis implementation.
//
// Usage:
//   const limiter = rateLimit({ limit: 5, windowMs: 15 * 60 * 1000 });
//   const result = await limiter.check(ip);
//   if (!result.success) return Response.json({ error: "Too many requests" }, { status: 429 });

interface RateLimitOptions {
  /** Maximum number of requests per window */
  limit: number;
  /** Time window in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number; // Unix timestamp (ms) when the window resets
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

function createRateLimiter(options: RateLimitOptions) {
  const store = new Map<string, WindowEntry>();

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || now > entry.resetAt) {
        // Start a new window
        const newEntry: WindowEntry = {
          count: 1,
          resetAt: now + options.windowMs,
        };
        store.set(key, newEntry);
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
      return {
        success: true,
        remaining: options.limit - entry.count,
        reset: entry.resetAt,
      };
    },
  };
}

// Pre-configured limiters for each public endpoint
export const inquiryLimiter = createRateLimiter({
  limit: 5,
  windowMs: 15 * 60 * 1000, // 5 requests per 15 minutes
});

export const whatsappLimiter = createRateLimiter({
  limit: 10,
  windowMs: 15 * 60 * 1000, // 10 requests per 15 minutes
});

export const customRequestLimiter = createRateLimiter({
  limit: 3,
  windowMs: 60 * 60 * 1000, // 3 requests per hour
});

/**
 * Extracts the client IP from a Next.js request.
 * Falls back to "unknown" if no IP can be determined.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
