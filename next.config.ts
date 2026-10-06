import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  output: "standalone",
  // Keep output tracing inside this repository when a parent folder contains
  // another package manager lockfile.
  outputFileTracingRoot: path.join(__dirname),
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    webpackMemoryOptimizations: true,
    cpus: 1,
    workerThreads: false,
  },
  // ─── Remote image patterns ──────────────────────────────────────────────────
  // Cloudinary is the primary image host.
  // Add more entries here if STORAGE_PROVIDER is switched to another service.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      // Unsplash images (used for project previews and mock data)
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      // Picsum Photos fallback
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      // Google profile avatars (used by NextAuth)
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      // GitHub assets and avatars
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        pathname: "/**",
      },
    ],
  },

  // ─── Security headers ───────────────────────────────────────────────────────
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    const allowAIStudioPreview =
      !isProduction &&
      (process.env.ALLOW_AI_STUDIO_PREVIEW === "true" ||
        process.env.ALLOW_AI_STUDIO_PREVIEW === undefined);

    const scriptSrc = isProduction
      ? "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com"
      : "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com";

    // N11: In production ALWAYS use frame-ancestors 'none'. Allow preview origins only in non-prod when ALLOW_AI_STUDIO_PREVIEW === "true", never bare *.
    const frameAncestors = allowAIStudioPreview
      ? "frame-ancestors 'self' https://*.run.app https://*.google.com https://*.google.dev"
      : "frame-ancestors 'none'";

    const headersList: { key: string; value: string }[] = [
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          scriptSrc,
          "frame-src 'self' https://challenges.cloudflare.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://images.unsplash.com https://picsum.photos https://raw.githubusercontent.com https://avatars.githubusercontent.com",
          "connect-src 'self' https://challenges.cloudflare.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          frameAncestors,
        ].join("; "),
      },
    ];

    if (!allowAIStudioPreview) {
      headersList.push({ key: "X-Frame-Options", value: "DENY" });
      headersList.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/(.*)",
        headers: headersList,
      },
    ];
  },

  // ─── Redirects ──────────────────────────────────────────────────────────────
  async redirects() {
    return [];
  },
};

export default nextConfig;
