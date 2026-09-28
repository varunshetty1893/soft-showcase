// app/robots.ts
// Generates robots.txt for Soft Showcase.
// Allows Google, Bing, and legitimate search crawlers to index public pages.
// Explicitly disallows private customer dashboards, admin panels, and API routes.

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
          "/cart",
        ],
        disallow: [
          "/admin",
          "/admin/*",
          "/api",
          "/api/*",
          "/profile",
          "/profile/*",
          "/my-inquiries",
          "/my-inquiries/*",
          "/my-requests",
          "/my-requests/*",
          "/login",
          "/register",
          "/verify-otp",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
