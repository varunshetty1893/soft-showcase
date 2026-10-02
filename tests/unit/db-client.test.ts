// tests/unit/db-client.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";

describe("Database Client Lifecycle & Mock Bundle Exclusion (H5 / N12)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PHASE;
    delete process.env.npm_lifecycle_event;
    delete process.env.USE_MOCK_DB;
    delete (globalThis as any).prisma;
    delete (globalThis as any).mockDb;
  });

  it("throws in production when DATABASE_URL is missing", async () => {
    (process.env as any).NODE_ENV = "production";
    delete process.env.DATABASE_URL;
    delete process.env.USE_MOCK_DB;

    await expect(async () => {
      // Re-import with clean modules
      const mod = await import("@/lib/db/client");
      // Accessing a property on db triggers client creation
      return (mod.db as any).user;
    }).rejects.toThrow(/DATABASE_URL environment variable is missing in production/);
  });

  it("N12: confirms no code touches .local_mock_store.json and .next/server bundle (when present) excludes mock-store markers", () => {
    const clientSource = fs.readFileSync(
      path.join(process.cwd(), "lib/db/client.ts"),
      "utf8"
    );
    const mockStoreSource = fs.readFileSync(
      path.join(process.cwd(), "lib/db/mock/mock-store.ts"),
      "utf8"
    );

    // Confirm no static import of mock-store in lib/db/client.ts
    expect(clientSource).not.toMatch(/import\s+.*mock-store/);
    // Confirm .local_mock_store.json is not touched anywhere in client.ts or mock-store.ts
    expect(clientSource).not.toContain(".local_mock_store.json");
    expect(mockStoreSource).not.toContain("fs.writeFileSync");
    expect(mockStoreSource).not.toContain("fs.readFileSync");
    expect(fs.existsSync(path.join(process.cwd(), ".local_mock_store.json"))).toBe(false);

    // If .next/server exists from a production build, verify demo provider marker ("elena@vancestudios.dev") is absent
    const nextServerDir = path.join(process.cwd(), ".next/server");
    if (fs.existsSync(nextServerDir)) {
      const collectFiles = (dir: string): string[] => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const files: string[] = [];
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            files.push(...collectFiles(fullPath));
          } else if (entry.isFile() && /\.(js|mjs|cjs)$/.test(entry.name)) {
            files.push(fullPath);
          }
        }
        return files;
      };

      const serverJsFiles = collectFiles(nextServerDir);
      for (const file of serverJsFiles) {
        const content = fs.readFileSync(file, "utf8");
        // Skip files compiled by the running `next dev` server (isDev=true / .runtime.dev.js)
        if (
          content.includes("isDev=true") ||
          content.includes(".runtime.dev.js")
        ) {
          continue;
        }
        expect(content).not.toContain("elena@vancestudios.dev");
      }
    }
  });
});
