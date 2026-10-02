import { createMockPrismaClient } from "@/lib/db/mock/mock-store";

(globalThis as unknown as { __createMockPrismaClient?: () => unknown }).__createMockPrismaClient =
  createMockPrismaClient;

/**
 * Determine whether a database URL points to a real database (as opposed to being empty or a local mock placeholder).
 */
export function isRealDatabaseUrl(url?: string | null): boolean {
  if (!url || !url.trim()) return false;
  const trimmed = url.trim();
  if (
    trimmed.includes("localhost:5432/mock") ||
    trimmed.includes("localhost:5432/build")
  ) {
    return false;
  }
  return true;
}

/**
 * Phase 5 Test Isolation Guard:
 * Aborts the test run immediately if a real DATABASE_URL / DIRECT_URL is present
 * or if USE_MOCK_DB is not enabled.
 */
export function assertTestDbIsolation(
  env: Record<string, string | undefined> = process.env
): void {
  if (isRealDatabaseUrl(env.DATABASE_URL) || isRealDatabaseUrl(env.DIRECT_URL)) {
    throw new Error(
      "[Test Isolation] Aborting test run: a real DATABASE_URL is present in the test environment. Tests must strictly use USE_MOCK_DB=true with no real DATABASE_URL."
    );
  }
  if (env.USE_MOCK_DB !== "true") {
    throw new Error(
      "[Test Isolation] Aborting test run: USE_MOCK_DB=true is required for all test runs."
    );
  }
}

// Enforce mock database isolation before any test executes
if (!process.env.USE_MOCK_DB) {
  process.env.USE_MOCK_DB = "true";
}
if (!isRealDatabaseUrl(process.env.DATABASE_URL)) {
  delete process.env.DATABASE_URL;
}
if (!isRealDatabaseUrl(process.env.DIRECT_URL)) {
  delete process.env.DIRECT_URL;
}

assertTestDbIsolation(process.env);
