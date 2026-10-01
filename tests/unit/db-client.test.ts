// tests/unit/db-client.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Database Client Lifecycle (H5)", () => {
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
});
