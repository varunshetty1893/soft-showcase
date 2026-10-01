// app/robots.ts
// Generates robots.txt for Soft Showcase.
// Matches real application route structure per B7 remediation.

import type { MetadataRoute } from "next";
import { APP_URL } from "@/config/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/projects",
          "/projects/*",
          "/custom-project",
          "/become-a-partner",
          "/support",
          "/terms",
          "/privacy",
        ],
        disallow: [
          "/cart",
          "/my-*",
          "/profile",
          "/profile/*",
          "/partner",
          "/partner/*",
          "/admin",
          "/admin/*",
          "/api",
          "/api/*",
          "/login",
          "/register",
          "/verify-email",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
