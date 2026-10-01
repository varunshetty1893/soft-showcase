// lib/utils/safe-redirect.ts
// Strict open-redirect defense helper for Soft Showcase.
// Validates and normalizes callback URLs to prevent malicious external redirection.

function getAppOrigin(): string | null {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  const appUrl =
    process.env.NEXTAUTH_URL ||
    process.env.AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  if (appUrl) {
    try {
      return new URL(appUrl).origin;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Sanitizes and validates a callbackUrl to prevent open redirect vulnerabilities.
 * Enforces:
 * 1. Must be a relative path starting with a single '/' or an absolute URL matching the application origin.
 * 2. Rejects protocol-relative URLs (//, /\), backslashes (\), and control characters.
 * 3. Decodes and re-checks encoded variants (e.g. %2F%2F, %2F%5C).
 * 4. Disallows redirects back to auth endpoints (/login, /register, /api/auth/*) to prevent redirect loops.
 */
export function getSafeCallbackUrl(raw: unknown, fallback: string = "/"): string {
  if (!raw || typeof raw !== "string") {
    return fallback;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return fallback;
  }

  // Reject control characters (0x00 - 0x1F and 0x7F)
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return fallback;
  }

  // If input specifies an explicit URI scheme (e.g. http:, https:, javascript:, data:, vbscript:)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    // Only permit http(s) if origin strictly matches our application origin
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      try {
        const parsed = new URL(trimmed);
        const appOrigin = getAppOrigin();
        if (appOrigin && parsed.origin.toLowerCase() === appOrigin.toLowerCase()) {
          return getSafeCallbackUrl(parsed.pathname + parsed.search + parsed.hash, fallback);
        }
      } catch {
        return fallback;
      }
    }
    return fallback;
  }

  // Decode URL-encoded variants (e.g. %2F%2F, %2F%5C, %00) and verify safely
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    return fallback;
  }

  // Re-verify control characters in decoded representation
  if (/[\x00-\x1F\x7F]/.test(decoded)) {
    return fallback;
  }

  // Must begin with a single '/' and not '//' or '/\'
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }

  // Verify decoded string also adheres to single '/' constraint
  if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.startsWith("/\\")) {
    return fallback;
  }

  // Reject backslashes in raw or decoded form
  if (trimmed.includes("\\") || decoded.includes("\\")) {
    return fallback;
  }

  // Reject schemes that were hidden in URL-encoded sequences
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) {
    return fallback;
  }

  // Strip query and fragment to inspect destination pathname
  const pathOnly = trimmed.split("?")[0].split("#")[0].toLowerCase();
  const decodedPathOnly = decoded.split("?")[0].split("#")[0].toLowerCase();

  // Reject auth endpoints to prevent redirect loops or login trap states
  const forbiddenPrefixes = ["/login", "/register", "/api/auth"];
  for (const prefix of forbiddenPrefixes) {
    if (
      pathOnly === prefix ||
      pathOnly.startsWith(`${prefix}/`) ||
      decodedPathOnly === prefix ||
      decodedPathOnly.startsWith(`${prefix}/`)
    ) {
      return fallback;
    }
  }

  return trimmed;
}
