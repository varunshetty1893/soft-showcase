// middleware.ts
// Route protection middleware for Soft Showcase.
// Second-layer defense: protects /partner (portal routes), /admin, and customer account routes.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getEnv } from "@/lib/config/env";
import { isAdminUser } from "@/lib/auth/admin";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Identify protected routes
  const isPartnerPortal =
    pathname.startsWith("/partner") &&
    !pathname.startsWith("/partner/register") &&
    !pathname.startsWith("/partner/status");

  const isAdminRoute = pathname.startsWith("/admin");

  const isCustomerRoute =
    pathname.startsWith("/my-transactions") ||
    pathname.startsWith("/my-inquiries") ||
    pathname.startsWith("/my-requests") ||
    pathname.startsWith("/my-support") ||
    pathname === "/profile";

  if (!isPartnerPortal && !isAdminRoute && !isCustomerRoute) {
    return NextResponse.next();
  }

  // 2. Extract and decode session JWT token with NextAuth v5 cookie resolution
  const env = getEnv();
  const authSecret = env.AUTH_SECRET;

  const isHttps =
    req.nextUrl.protocol === "https:" ||
    req.headers.get("x-forwarded-proto") === "https" ||
    process.env.NODE_ENV === "production";

  const hasSecureCookie =
    req.cookies.has("__Secure-authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token.0") ||
    req.cookies.has("__Secure-next-auth.session-token") ||
    req.cookies.has("__Secure-next-auth.session-token.0");

  const useSecure = isHttps || hasSecureCookie;

  let token = await getToken({
    req,
    secret: authSecret,
    secureCookie: useSecure,
  });

  if (!token?.id) {
    token = await getToken({
      req,
      secret: authSecret,
      secureCookie: !useSecure,
    });
  }

  if (!token?.id) {
    token = await getToken({
      req,
      secret: authSecret,
      cookieName: useSecure
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
    });
  }

  // 3. Unauthenticated access check
  if (!token?.id) {
    if (pathname === "/login") {
      return NextResponse.next();
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Admin route check: trusts ONLY DB-backed flag carried in token, no email comparisons
  const isAdmin = isAdminUser(token);

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/?error=AdminAccessRequired", req.url));
  }

  // 5. Partner portal check: Admins allowed; partners must have active and approved profile
  if (isPartnerPortal && !isAdmin) {
    const isApproved = token.partnerStatus === "approved";
    const hasPartnerId = Boolean(token.partnerId);

    if (!hasPartnerId || !isApproved) {
      const status = (token.partnerStatus as string) || "pending";
      const statusUrl = new URL("/partner/status", req.url);
      if (token.partnerStatus) {
        statusUrl.searchParams.set("status", status);
      }
      return NextResponse.redirect(statusUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/partner/:path*",
    "/admin/:path*",
    "/my-transactions/:path*",
    "/my-inquiries/:path*",
    "/my-requests/:path*",
    "/my-support/:path*",
    "/profile/:path*",
  ],
};
