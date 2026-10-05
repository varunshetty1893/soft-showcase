import dotenv from "dotenv";
import path from "path";
import { createMockPrismaClient } from "@/lib/db/mock/mock-store";

// Pre-register the Vite-resolved mock store factory for lib/db/client.ts
(globalThis as any).__mockStoreModule = { createMockPrismaClient };

// Load .env.local first (overrides .env), then .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

if (!process.env.DATABASE_URL) {
  process.env.USE_MOCK_DB = "true";
  process.env.DATABASE_URL = "postgresql://mock:mock@localhost:5432/mock";
}

/**
 * Guard to ensure unit tests do not accidentally run against a production or cloud database.
 */
export function assertTestDbIsolation(env: Record<string, string | undefined> = process.env): void {
  const dbUrl = env.DATABASE_URL || "";
  if (
    dbUrl &&
    !dbUrl.includes("mock") &&
    !dbUrl.includes("localhost") &&
    !dbUrl.includes("127.0.0.1")
  ) {
    throw new Error("Aborting test run: a real DATABASE_URL is present");
  }
}
