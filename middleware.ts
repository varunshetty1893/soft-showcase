// middleware.ts
// Route protection middleware for Soft Showcase.
// Second-layer defense: protects /partner (portal routes), /admin, and customer account routes.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const authSecret =
  process.env.AUTH_SECRET ||
  (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build"
    ? undefined
    : "development-and-build-secret-soft-showcase-fallback-key-32-chars");

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

  // 2. Extract and decode session JWT token
  const token = await getToken({
    req,
    secret: authSecret,
  });

  // 3. Unauthenticated access check
  if (!token?.id) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const userEmail = (token.email as string || "").trim().toLowerCase();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const isEnvAdmin = Boolean(userEmail && adminEmail && userEmail === adminEmail);
  const isAdmin = Boolean(token.isAdmin || token.role === "admin" || isEnvAdmin);

  // 4. Admin route check
  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/", req.url));
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
