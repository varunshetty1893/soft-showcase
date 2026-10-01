// lib/auth/session.ts
// Server-side session helpers for Soft Showcase.
// Used in server components, API routes, and layout guards.

import { auth } from "@/lib/auth/auth";
export { auth };
import { redirect } from "next/navigation";
import { isAdminUser } from "@/lib/auth/admin";

// ── Error classes ─────────────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(
    public code: "UNAUTHORIZED" | "FORBIDDEN",
    message?: string
  ) {
    super(message ?? code);
    this.name = "AuthError";
  }
}

// ── Session helpers ───────────────────────────────────────────────────────────

/**
 * Get the current server-side session.
 * Returns null if the user is not authenticated.
 */
export async function getSession() {
  return auth();
}

/**
 * Get the current user from the session.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  try {
    const session = await auth();
    return session?.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Require authentication — for use in server components and API routes.
 *
 * In a SERVER COMPONENT: throws redirect to /login if not authenticated.
 * In an API ROUTE: throws AuthError("UNAUTHORIZED") to be caught by the handler.
 *
 * @param useRedirect - Set to true in server components (layouts/pages).
 *                      Set to false in API routes.
 */
export async function requireAuth(useRedirect = false) {
  const session = await auth();

  if (!session?.user) {
    if (useRedirect) {
      redirect("/login");
    }
    throw new AuthError("UNAUTHORIZED");
  }

  return session;
}

/**
 * Require admin access — for use in admin server components and API routes.
 *
 * In a SERVER COMPONENT: throws redirect to / if authenticated but not admin,
 *                        or to /login if not authenticated.
 * In an API ROUTE: throws AuthError("FORBIDDEN") or AuthError("UNAUTHORIZED").
 *
 * Trusts ONLY DB-backed flag carried in session (zero email comparison).
 *
 * @param useRedirect - Set to true in server components (layouts/pages).
 *                      Set to false in API routes.
 */
export async function requireAdmin(useRedirect = false) {
  const session = await auth();

  if (!session?.user) {
    if (useRedirect) {
      redirect("/login?callbackUrl=/admin");
    }
    throw new AuthError("UNAUTHORIZED");
  }

  const isAdmin = isAdminUser(session.user);

  if (!isAdmin) {
    if (useRedirect) {
      redirect("/");
    }
    throw new AuthError("FORBIDDEN");
  }

  return session;
}

// ── API route error response helper ───────────────────────────────────────────

/**
 * Convert an AuthError to a NextResponse-compatible status code and message.
 * Use in API routes:
 *
 *   try {
 *     const session = await requireAdmin();
 *     ...
 *   } catch (e) {
 *     if (e instanceof AuthError) return authErrorResponse(e);
 *     throw e;
 *   }
 */
export function authErrorResponse(error: AuthError): Response {
  const status = error.code === "UNAUTHORIZED" ? 401 : 403;
  return Response.json({ error: error.code }, { status });
}
