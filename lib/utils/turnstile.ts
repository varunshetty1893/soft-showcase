// lib/utils/turnstile.ts
// Cloudflare Turnstile token validation helper for unauthenticated submissions.
// Zero external dependencies (uses native fetch).
// Source of truth: Cloudflare Turnstile Server-side Validation API (N1).

export interface TurnstileVerificationResult {
  success: boolean;
  errorCodes?: string[];
  challengeTs?: string;
  hostname?: string;
  unreachable?: boolean;
}

function getExpectedAppHostname(explicitHostname?: string): string | null {
  if (explicitHostname && explicitHostname.trim()) {
    return explicitHostname.trim().toLowerCase();
  }
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL;
  if (!appUrl) return null;
  try {
    return new URL(appUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Validates a Turnstile token against Cloudflare's siteverify endpoint.
 * - In production, a missing TURNSTILE_SECRET_KEY ALWAYS fails closed (error code: "not-configured").
 * - In development/test (NODE_ENV !== "production"), if TURNSTILE_SECRET_KEY is not set, bypasses cleanly.
 * - Verifies that the returned hostname matches the configured application hostname when present.
 */
export async function verifyTurnstileToken(
  token?: string | null,
  clientIp?: string,
  expectedHostname?: string
): Promise<TurnstileVerificationResult> {
  const isProd = process.env.NODE_ENV === "production";
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim();

  if (!secretKey) {
    if (!isProd) {
      return { success: true };
    }
    console.error("[Turnstile] Error: TURNSTILE_SECRET_KEY is not configured in production. Failing closed.");
    return {
      success: false,
      errorCodes: ["not-configured"],
    };
  }

  if (!token || typeof token !== "string" || !token.trim()) {
    return {
      success: false,
      errorCodes: ["missing-input-response"],
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
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
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.warn(`[Turnstile] Verification HTTP error: ${res.status}`);
      return {
        success: false,
        errorCodes: [`http-${res.status}`],
        unreachable: res.status >= 500,
      };
    }

    const data = await res.json();
    const errorCodes: string[] | undefined = data["error-codes"];
    const returnedHostname: string | undefined = data.hostname;

    if (!data.success) {
      return {
        success: false,
        errorCodes: errorCodes && errorCodes.length > 0 ? errorCodes : ["invalid-input-response"],
        challengeTs: data.challenge_ts,
        hostname: returnedHostname,
      };
    }

    // Verify returned hostname matches the app host when present (N1)
    if (returnedHostname) {
      const normalizedReturned = returnedHostname.trim().toLowerCase();
      const targetHost = getExpectedAppHostname(expectedHostname);
      if (targetHost) {
        const isLocalDevHost =
          !isProd && (normalizedReturned === "localhost" || normalizedReturned === "127.0.0.1");
        if (normalizedReturned !== targetHost && !isLocalDevHost) {
          console.warn(
            `[Turnstile] Hostname mismatch: expected "${targetHost}", got "${normalizedReturned}"`
          );
          return {
            success: false,
            errorCodes: ["hostname-mismatch"],
            challengeTs: data.challenge_ts,
            hostname: returnedHostname,
          };
        }
      }
    }

    return {
      success: true,
      errorCodes,
      challengeTs: data.challenge_ts,
      hostname: returnedHostname,
    };
  } catch (err: unknown) {
    console.error("[Turnstile] Verification exception:", err);
    return {
      success: false,
      errorCodes: ["network-error"],
      unreachable: true,
    };
  }
}
