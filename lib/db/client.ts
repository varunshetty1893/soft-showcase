// lib/db/client.ts
// Production-grade PrismaClient singleton with dev global cache and mock fallback.
// In production, enforces valid DATABASE_URL and throws if missing.
// In development, allows optional mock store strictly when USE_MOCK_DB=true or no DATABASE_URL.

import { PrismaClient } from "@prisma/client";
import { createMockPrismaClient } from "./mock/mock-store";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  mockDb?: any;
};

function getClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  const isProduction = process.env.NODE_ENV === "production";
  const isVitest = Boolean(process.env.VITEST);
  const isBuildPhase =
    !isVitest &&
    (process.env.NEXT_PHASE === "phase-production-build" ||
      (process.env.npm_lifecycle_event === "build" && process.env.NODE_ENV !== "test") ||
      (Array.isArray(process.argv) &&
        process.argv.some(
          (arg) => typeof arg === "string" && (arg === "build" || arg === "next build")
        )));

  const useMockDb =
    (isBuildPhase && (!databaseUrl || !databaseUrl.trim())) ||
    (!isProduction && (process.env.USE_MOCK_DB === "true" || !databaseUrl || !databaseUrl.trim()));

  if (useMockDb) {
    if (!globalForPrisma.mockDb) {
      globalForPrisma.mockDb = createMockPrismaClient();
      console.warn(
        `[Database] Running with in-memory mock store (${
          isBuildPhase
            ? "build phase active without DATABASE_URL"
            : process.env.USE_MOCK_DB === "true"
            ? "USE_MOCK_DB=true"
            : "no DATABASE_URL in development"
        }).`
      );
    }
    return globalForPrisma.mockDb;
  }

  if (isProduction && !isBuildPhase && (!databaseUrl || !databaseUrl.trim())) {
    throw new Error(
      "[Database] Fatal: DATABASE_URL environment variable is missing in production. Application cannot start."
    );
  }

  if (!globalForPrisma.prisma) {
    try {
      globalForPrisma.prisma = new PrismaClient({
        ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
        log:
          process.env.DEBUG_PRISMA === "true"
            ? ["query", "error", "warn"]
            : ["error"],
      });
    } catch (err) {
      console.warn("[Database] PrismaClient initialization failed — using mock store fallback:", err);
      if (!globalForPrisma.mockDb) {
        globalForPrisma.mockDb = createMockPrismaClient();
      }
      return globalForPrisma.mockDb;
    }
  }

  return globalForPrisma.prisma;
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const val = (client as any)[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});

export default db;
