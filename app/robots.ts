// app/robots.ts
// Generates robots.txt for the application.
// See: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots

import type { MetadataRoute } from "next";
import { APP_URL } from "@/config/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/profile",
          "/my-inquiries",
          "/my-requests",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
