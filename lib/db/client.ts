// lib/db/client.ts
// Production-grade PrismaClient singleton with dev global cache.
// In production, enforces valid DATABASE_URL and throws if missing.
// In development, allows optional mock store strictly when USE_MOCK_DB=true.

import { PrismaClient } from "@prisma/client";

const isProduction = process.env.NODE_ENV === "production";
const useMockDb = !isProduction && process.env.USE_MOCK_DB === "true";

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (isProduction && (!databaseUrl || !databaseUrl.trim())) {
    throw new Error(
      "[Database] Fatal: DATABASE_URL environment variable is missing in production. Application cannot start."
    );
  }

  return new PrismaClient({
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
    // Dynamic require so mock store is not included in production builds
    const { createMockPrismaClient } = require("./mock/mock-store");
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
