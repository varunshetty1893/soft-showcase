// tests/unit/routes.test.ts
// Unit tests for Route Existence (B7).
// Verifies every internal href in Footer, Navbar, and Auth pages resolves to a real route.

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Normalizes an app directory path into a public URL route.
 * Handles Next.js route groups (e.g. `(auth)`, `(customer)`, `(portal)`).
 */
function normalizeAppPathToRoute(filePath: string): string {
  // Relative to app/
  const relative = path.relative(path.join(process.cwd(), "app"), filePath);
  const segments = relative.split(path.sep);

  // Remove route groups like (auth), (customer), (portal) and page.tsx
  const filtered = segments
    .filter((s) => !s.startsWith("(") && !s.endsWith(")") && s !== "page.tsx" && s !== "route.ts")
    .join("/");

  return "/" + filtered;
}

/**
 * Scans app/ directory to discover all registered Next.js App Router routes.
 */
function getAllAppRoutes(): Set<string> {
  const appDir = path.join(process.cwd(), "app");
  const routes = new Set<string>();

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name === "page.tsx") {
        routes.add(normalizeAppPathToRoute(fullPath));
      }
    }
  }

  walk(appDir);
  return routes;
}

/**
 * Extracts all internal `href="..."` links from a file.
 */
function extractInternalHrefs(filePath: string): string[] {
  const content = fs.readFileSync(path.join(process.cwd(), filePath), "utf-8");
  const hrefRegex = /href=["']([^"']+)["']/g;
  const hrefs: string[] = [];
  let match;

  while ((match = hrefRegex.exec(content)) !== null) {
    const href = match[1];
    // Only test internal links (starting with /)
    if (href.startsWith("/")) {
      hrefs.push(href);
    }
  }

  return hrefs;
}

/**
 * Checks if a route path exists in discovered Next.js routes.
 * Supports query params, hash fragments, and dynamic parameters.
 */
function routeExists(href: string, registeredRoutes: Set<string>): boolean {
  // Strip hash and query parameters for route resolution
  const cleanPath = href.split("#")[0].split("?")[0];
  if (cleanPath === "" || cleanPath === "/") return registeredRoutes.has("/");

  // Exact match
  if (registeredRoutes.has(cleanPath)) return true;

  // Check dynamic segment matches (e.g. /projects/slug against /projects/[slug])
  for (const registered of registeredRoutes) {
    const regSegments = registered.split("/").filter(Boolean);
    const pathSegments = cleanPath.split("/").filter(Boolean);

    if (regSegments.length === pathSegments.length) {
      const matches = regSegments.every((seg, idx) => {
        if (seg.startsWith("[") && seg.endsWith("]")) return true;
        return seg === pathSegments[idx];
      });
      if (matches) return true;
    }
  }

  return false;
}

describe("Route Existence Verification (B7)", () => {
  const allRoutes = getAllAppRoutes();

  it("verifies public pages /support, /terms, and /privacy exist", () => {
    expect(allRoutes.has("/support")).toBe(true);
    expect(allRoutes.has("/terms")).toBe(true);
    expect(allRoutes.has("/privacy")).toBe(true);
  });

  it("ensures all internal links in Footer.tsx resolve to existing routes", () => {
    const footerHrefs = extractInternalHrefs("components/layout/Footer.tsx");
    expect(footerHrefs.length).toBeGreaterThan(0);

    for (const href of footerHrefs) {
      const exists = routeExists(href, allRoutes);
      expect(exists, `Footer link ${href} should resolve to a valid route`).toBe(true);
    }
  });

  it("ensures all internal links in NavbarClient.tsx resolve to existing routes", () => {
    const navbarHrefs = extractInternalHrefs("components/layout/NavbarClient.tsx");
    expect(navbarHrefs.length).toBeGreaterThan(0);

    for (const href of navbarHrefs) {
      const exists = routeExists(href, allRoutes);
      expect(exists, `Navbar link ${href} should resolve to a valid route`).toBe(true);
    }
  });

  it("ensures all internal links in Auth pages resolve to existing routes", () => {
    const authFiles = [
      "app/(auth)/login/page.tsx",
      "app/(auth)/register/page.tsx",
      "app/(auth)/verify-email/page.tsx",
      "app/(auth)/forgot-password/page.tsx",
    ];

    for (const file of authFiles) {
      if (fs.existsSync(path.join(process.cwd(), file))) {
        const hrefs = extractInternalHrefs(file);
        for (const href of hrefs) {
          const exists = routeExists(href, allRoutes);
          expect(exists, `Link ${href} in ${file} should resolve to a valid route`).toBe(true);
        }
      }
    }
  });
});
