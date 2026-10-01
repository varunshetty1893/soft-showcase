// app/api/auth/[...nextauth]/route.ts
// NextAuth v5 API handler — handles all /api/auth/* routes:
//   GET  /api/auth/signin
//   POST /api/auth/signin
//   GET  /api/auth/callback/google
//   POST /api/auth/signout
//   GET  /api/auth/session
//   GET  /api/auth/csrf
//   GET  /api/auth/providers
//
// Includes dynamic host resolution to ensure 0.0.0.0 is never returned
// in redirects, cookies, or JSON responses behind Cloud Run / dev server proxies.

import { handlers } from "@/lib/auth/auth";
import { NextRequest, NextResponse } from "next/server";

function resolveClientOrigin(req: NextRequest): string {
  const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const forwardedProto = req.headers.get("x-forwarded-proto") || (req.url.startsWith("https") ? "https" : "http");

  const host = forwardedHost.split(",")[0].trim().replace(/^0\.0\.0\.0/, "localhost");
  const proto = forwardedProto.split(",")[0].trim();

  if (host) {
    return `${proto}://${host}`;
  }

  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }

  return req.nextUrl.origin.replace("0.0.0.0", "localhost");
}

function ensureEnvUrl(origin: string) {
  if (
    !process.env.AUTH_URL ||
    process.env.AUTH_URL.includes("0.0.0.0") ||
    !process.env.NEXTAUTH_URL ||
    process.env.NEXTAUTH_URL.includes("0.0.0.0")
  ) {
    process.env.AUTH_URL = origin;
    process.env.NEXTAUTH_URL = origin;
  }
}

async function sanitizeAuthResponse(res: Response, origin: string): Promise<Response> {
  const location = res.headers.get("location");
  let needsLocationRewrite = false;
  let newLocation = location;

  if (
    location &&
    (location.includes("0.0.0.0:3000") ||
      (location.startsWith("http://localhost:3000") && origin.startsWith("https://")))
  ) {
    needsLocationRewrite = true;
    newLocation = location
      .replace(/^https?:\/\/0\.0\.0\.0:3000/, origin)
      .replace(/^http:\/\/localhost:3000/, origin);
  }

  const newHeaders = new Headers(res.headers);
  if (needsLocationRewrite && newLocation) {
    newHeaders.set("location", newLocation);
  }

  // Sanitize Set-Cookie header if it contains 0.0.0.0
  const rawSetCookie = newHeaders.get("set-cookie");
  if (rawSetCookie && rawSetCookie.includes("0.0.0.0")) {
    const originHost = origin.replace(/^https?:\/\//, "");
    const encodedHost = encodeURIComponent(originHost);
    const sanitizedSetCookie = rawSetCookie
      .replace(/0\.0\.0\.0%3A3000/g, encodedHost)
      .replace(/0\.0\.0\.0:3000/g, originHost);
    newHeaders.set("set-cookie", sanitizedSetCookie);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const text = await res.text();
    if (
      text.includes("0.0.0.0:3000") ||
      (text.includes("http://localhost:3000") && origin.startsWith("https://"))
    ) {
      const sanitizedText = text
        .replace(/https?:\/\/0\.0\.0\.0:3000/g, origin)
        .replace(/http:\/\/localhost:3000/g, origin);
      return new Response(sanitizedText, {
        status: res.status,
        statusText: res.statusText,
        headers: newHeaders,
      });
    }
    return new Response(text, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  }

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: newHeaders,
  });
}

export async function GET(req: NextRequest) {
  try {
    const origin = resolveClientOrigin(req);
    ensureEnvUrl(origin);
    const res = await handlers.GET(req);
    return await sanitizeAuthResponse(res, origin);
  } catch (error) {
    console.warn("[Auth API] GET handler warning:", error);
    return NextResponse.json(null, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const origin = resolveClientOrigin(req);
    ensureEnvUrl(origin);
    const res = await handlers.POST(req);
    return await sanitizeAuthResponse(res, origin);
  } catch (error) {
    console.warn("[Auth API] POST handler warning:", error);
    return NextResponse.json({ error: "AuthError", message: "Sign in error" }, { status: 400 });
  }
}
