// lib/config/env.ts
// Zod-validated, memoized environment configuration.
// Edge-safe: contains no Node-only modules to allow safe consumption in middleware.

import { z } from "zod";

const FORBIDDEN_DEFAULT_SECRET = "soft-showcase-secure-auth-jwt-secret-key-32-chars-long";
const DEV_ONLY_AUTH_SECRET = "dev-secret-do-not-use-in-production-min-32-chars-long!";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters long")
    .refine(
      (val) => val !== FORBIDDEN_DEFAULT_SECRET,
      "AUTH_SECRET must not use the deprecated default fallback secret"
    ),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_URL: z.string().optional(),
  NEXTAUTH_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let memoizedEnv: AppEnv | null = null;

export function getEnv(overrideEnv?: Record<string, string | undefined>): AppEnv {
  if (memoizedEnv && !overrideEnv) {
    return memoizedEnv;
  }

  const source = overrideEnv || process.env;
  const isProd = (source.NODE_ENV || process.env.NODE_ENV) === "production";
  const isBuildPhase = source.NEXT_PHASE === "phase-production-build" || process.env.NEXT_PHASE === "phase-production-build";

  let authSecret = source.AUTH_SECRET || source.NEXTAUTH_SECRET;

  if (!authSecret) {
    if (!isProd) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("[Config] WARNING: AUTH_SECRET is not set. Using dev-only secret for local development.");
      }
      authSecret = DEV_ONLY_AUTH_SECRET;
    } else if (isBuildPhase) {
      authSecret = DEV_ONLY_AUTH_SECRET;
    }
  }

  const raw = {
    NODE_ENV: source.NODE_ENV || "development",
    AUTH_SECRET: authSecret,
    DATABASE_URL: source.DATABASE_URL || (isBuildPhase && isProd ? "postgres://build:build@localhost:5432/build" : ""),
    AUTH_URL: source.AUTH_URL || source.NEXTAUTH_URL || source.NEXT_PUBLIC_APP_URL,
    NEXTAUTH_URL: source.NEXTAUTH_URL || source.AUTH_URL || source.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_URL: source.NEXT_PUBLIC_APP_URL || source.AUTH_URL || source.NEXTAUTH_URL,
    UPSTASH_REDIS_REST_URL: source.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: source.UPSTASH_REDIS_REST_TOKEN,
    ADMIN_EMAIL: source.ADMIN_EMAIL,
    ADMIN_EMAILS: source.ADMIN_EMAILS,
  };

  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    if (isProd && !isBuildPhase) {
      const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      throw new Error(`[Config] Production environment validation failed: ${issues}`);
    }
  }

  // Stricter production runtime checks (if not building)
  if (isProd && !isBuildPhase) {
    if (!raw.DATABASE_URL) {
      throw new Error("[Config] Production error: DATABASE_URL is required at runtime.");
    }
    const hasAppUrl = Boolean(raw.AUTH_URL || raw.NEXTAUTH_URL || raw.NEXT_PUBLIC_APP_URL);
    if (!hasAppUrl) {
      throw new Error("[Config] Production error: NEXTAUTH_URL, AUTH_URL, or NEXT_PUBLIC_APP_URL is required.");
    }
    if (!raw.UPSTASH_REDIS_REST_URL || !raw.UPSTASH_REDIS_REST_TOKEN) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("[Config] Production warning: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set. Memory fallback will be used.");
      }
    }
  }

  const resolved = (parsed.success ? parsed.data : (raw as unknown as AppEnv));
  if (!overrideEnv) {
    memoizedEnv = resolved;
  }
  return resolved;
}

export const env = getEnv();
