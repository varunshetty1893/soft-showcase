// lib/db/client.ts
// Production-grade PrismaClient singleton with dev global cache.
// In production, enforces valid DATABASE_URL and throws if missing.
// In development, allows optional mock store strictly when USE_MOCK_DB=true.

import { PrismaClient } from "@prisma/client";
import { createMockPrismaClient } from "./mock/mock-store";

const isProduction = process.env.NODE_ENV === "production";
const useMockDb = !isProduction && (process.env.USE_MOCK_DB === "true" || !process.env.DATABASE_URL);

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  const isBuildPhase =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build" ||
    process.argv.some((arg) => typeof arg === "string" && arg.includes("build"));

  if (isProduction && !isBuildPhase && (!databaseUrl || !databaseUrl.trim())) {
    throw new Error(
      "[Database] Fatal: DATABASE_URL environment variable is missing in production. Application cannot start."
    );
  }

  return new PrismaClient({
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
    log: process.env.DEBUG_PRISMA === "true" ? ["query", "error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  mockDb?: any;
};

let clientInstance: any;

if (useMockDb) {
  if (!globalForPrisma.mockDb) {
    globalForPrisma.mockDb = createMockPrismaClient();
    console.warn("[Database] Running with in-memory mock store (USE_MOCK_DB=true).");
  }
  clientInstance = globalForPrisma.mockDb;
} else {
  if (isProduction) {
    clientInstance = createPrismaClient();
  } else {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    clientInstance = globalForPrisma.prisma;
  }
}

export const db: PrismaClient = clientInstance;
export default db;
