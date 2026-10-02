// lib/db/client.ts
// Production-grade PrismaClient singleton with dev global cache and dev/test-only mock fallback.
// In production, enforces valid DATABASE_URL and throws if missing.
// Mock database code is loaded strictly behind process.env.NODE_ENV !== "production" so bundlers tree-shake it from production builds (N12).

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  mockDb?: PrismaClient;
};

function getClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  const isVitest = Boolean(process.env.VITEST);
  const isBuildPhase =
    !isVitest &&
    (process.env.NEXT_PHASE === "phase-production-build" ||
      (process.env.npm_lifecycle_event === "build" && process.env.NODE_ENV !== "test") ||
      (Array.isArray(process.argv) &&
        process.argv.some(
          (arg) => typeof arg === "string" && (arg === "build" || arg === "next build")
        )));

  // Statically foldable development/test-only branch: eliminated by bundler in production builds (N12)
  if (process.env.NODE_ENV !== "production") {
    const useMockDb =
      process.env.USE_MOCK_DB === "true" || !databaseUrl || !databaseUrl.trim();

    if (useMockDb) {
      if (!globalForPrisma.mockDb) {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { createMockPrismaClient } = require("./mock/mock-store");
        globalForPrisma.mockDb = createMockPrismaClient();
        console.warn(
          `[Database] Running with in-memory mock store (${
            process.env.USE_MOCK_DB === "true"
              ? "USE_MOCK_DB=true"
              : "no DATABASE_URL in development"
          }).`
        );
      }
      return globalForPrisma.mockDb!;
    }
  }

  if (process.env.NODE_ENV === "production" && !isBuildPhase && (!databaseUrl || !databaseUrl.trim())) {
    throw new Error(
      "[Database] Fatal: DATABASE_URL environment variable is missing in production. Application cannot start."
    );
  }

  if (!globalForPrisma.prisma) {
    const resolvedUrl =
      databaseUrl && databaseUrl.trim()
        ? databaseUrl
        : "postgresql://build:build@localhost:5432/build";

    try {
      globalForPrisma.prisma = new PrismaClient({
        datasources: { db: { url: resolvedUrl } },
        log:
          process.env.DEBUG_PRISMA === "true"
            ? ["query", "error", "warn"]
            : ["error"],
      });
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[Database] PrismaClient initialization failed — using mock store fallback:", err);
        if (!globalForPrisma.mockDb) {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { createMockPrismaClient } = require("./mock/mock-store");
          globalForPrisma.mockDb = createMockPrismaClient();
        }
        return globalForPrisma.mockDb!;
      }
      throw err;
    }
  }

  return globalForPrisma.prisma;
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});

export default db;
