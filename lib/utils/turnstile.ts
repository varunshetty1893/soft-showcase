// lib/utils/turnstile.ts
// Cloudflare Turnstile token validation helper for unauthenticated submissions.
// Zero external dependencies (uses native fetch).
// Source of truth: Cloudflare Turnstile Server-side Validation API.

import { getEnv } from "@/lib/config/env";

export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes?: string[];
  challengeTs?: string;
  hostname?: string;
}

/**
 * Validates a Turnstile token against Cloudflare's siteverify endpoint.
 * In development or test environments where TURNSTILE_SECRET_KEY is not configured,
 * verification gracefully succeeds to facilitate local testing.
 */
export async function verifyTurnstileToken(
  token?: string | null,
  clientIp?: string
): Promise<TurnstileVerificationResult> {
  const env = getEnv();
  const secretKey = env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY;

  // In development / test without Turnstile secret configured, bypass
  if (!secretKey) {
    if (process.env.NODE_ENV !== "production") {
      return { success: true };
    }
    console.warn("[Turnstile] Warning: TURNSTILE_SECRET_KEY is not configured in production.");
    return { success: true };
  }

  if (!token || typeof token !== "string" || !token.trim()) {
    return {
      success: false,
      errorCodes: ["missing-input-response"],
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey.trim());
    formData.append("response", token.trim());
    if (clientIp && !clientIp.startsWith("fp_")) {
      formData.append("remoteip", clientIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
      // 5-second timeout to prevent request hanging
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn(`[Turnstile] Verification HTTP error: ${res.status}`);
      return { success: false, errorCodes: [`http-${res.status}`] };
    }

    const data = await res.json();
    return {
      success: Boolean(data.success),
      errorCodes: data["error-codes"],
      challengeTs: data.challenge_ts,
      hostname: data.hostname,
    };
  } catch (err: unknown) {
    console.error("[Turnstile] Verification exception:", err);
    // On unexpected network timeout / connectivity error, fail closed in production, open in dev
    return {
      success: process.env.NODE_ENV !== "production",
      errorCodes: ["network-error"],
    };
  }
}
