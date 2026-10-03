// lib/utils/turnstile.ts
// Cloudflare Turnstile token validation helper for unauthenticated submissions.
// Zero external dependencies (uses native fetch).
// Source of truth: Cloudflare Turnstile Server-side Validation API.

import { getEnv } from "@/lib/config/env";

export interface TurnstileVerificationResult {
  success: boolean;
  unreachable?: boolean;
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
    console.error("[Turnstile] Error: TURNSTILE_SECRET_KEY is not configured in production.");
    return { success: false, errorCodes: ["not-configured"] };
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
      return { success: false, unreachable: true, errorCodes: [`http-${res.status}`] };
    }

    const data = await res.json();
    const isSuccess = Boolean(data.success);

    if (!isSuccess) {
      return {
        success: false,
        errorCodes: data["error-codes"] || ["turnstile-failed"],
        challengeTs: data.challenge_ts,
        hostname: data.hostname,
      };
    }

    // Hostname validation in production
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (process.env.NODE_ENV === "production" && appUrl && data.hostname) {
      try {
        const expectedHost = new URL(appUrl).hostname;
        if (data.hostname !== expectedHost) {
          console.warn(`[Turnstile] Hostname mismatch: got ${data.hostname}, expected ${expectedHost}`);
          return {
            success: false,
            errorCodes: ["hostname-mismatch"],
            hostname: data.hostname,
          };
        }
      } catch {
        // Ignore URL parsing errors
      }
    }

    return {
      success: true,
      challengeTs: data.challenge_ts,
      hostname: data.hostname,
    };
  } catch (err: unknown) {
    console.error("[Turnstile] Verification exception:", err);
    // On unexpected network timeout / connectivity error, mark unreachable
    return {
      success: process.env.NODE_ENV !== "production",
      unreachable: true,
      errorCodes: ["network-error"],
    };
  }
}
