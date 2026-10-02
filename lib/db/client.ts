// lib/db/client.ts
// Production-grade PrismaClient singleton with dev global cache and dev/test-only mock fallback.
// In production, enforces valid DATABASE_URL and throws if missing.
// Mock database code is loaded strictly behind process.env.NODE_ENV !== "production" so bundlers tree-shake it from production builds (N12).

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  mockDb?: PrismaClient;
  __createMockPrismaClient?: () => PrismaClient;
};

function loadMockPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV !== "production") {
    if (typeof globalForPrisma.__createMockPrismaClient === "function") {
      return globalForPrisma.__createMockPrismaClient();
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMockPrismaClient } = require("./mock/mock-store");
    return createMockPrismaClient();
  }
  throw new Error("[Database] Mock store is disabled in production.");
}

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
        globalForPrisma.mockDb = loadMockPrismaClient();
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
          isBuildPhase && (!databaseUrl || !databaseUrl.trim())
            ? []
            : process.env.DEBUG_PRISMA === "true"
            ? ["query", "error", "warn"]
            : ["error"],
      });
      if (!isBuildPhase && !isVitest) {
        void ensureAdditiveSchema();
      }
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[Database] PrismaClient initialization failed — using mock store fallback:", err);
        if (!globalForPrisma.mockDb) {
          globalForPrisma.mockDb = loadMockPrismaClient();
        }
        return globalForPrisma.mockDb!;
      }
      throw err;
    }
  }

  return globalForPrisma.prisma;
}

function isInitializationOrConnectionError(err: unknown): boolean {
  const name = (err as { name?: string })?.name || "";
  const code = (err as { code?: string; errorCode?: string })?.code || (err as { errorCode?: string })?.errorCode || "";
  const msg = String((err as { message?: string })?.message || "");
  return (
    name.includes("PrismaClientInitializationError") ||
    code === "P1000" ||
    code === "P1001" ||
    code === "P1002" ||
    code === "P1003" ||
    msg.includes("Can't reach database server") ||
    msg.includes("PrismaClientInitializationError") ||
    msg.includes("Environment variable not found: DATABASE_URL") ||
    msg.includes("Authentication failed against database server")
  );
}

function wrapModelDelegate(
  delegate: Record<string | symbol, unknown>,
  modelName: string | symbol
): Record<string | symbol, unknown> {
  if (process.env.NODE_ENV !== "production") {
    return new Proxy(delegate, {
      get(target, methodProp) {
        const orig = target[methodProp];
        if (typeof orig !== "function") return orig;
        return (...args: unknown[]) => {
          try {
            const res = orig.apply(target, args);
            if (res && typeof (res as Promise<unknown>).catch === "function") {
              return (res as Promise<unknown>).catch((err: unknown) => {
                if (isInitializationOrConnectionError(err)) {
                  if (!globalForPrisma.mockDb) {
                    globalForPrisma.mockDb = loadMockPrismaClient();
                  }
                  const mockDelegate = (
                    globalForPrisma.mockDb as unknown as Record<string | symbol, Record<string | symbol, unknown>>
                  )[modelName];
                  const mockFn = mockDelegate?.[methodProp];
                  if (typeof mockFn === "function") {
                    return mockFn.apply(mockDelegate, args);
                  }
                }
                throw err;
              });
            }
            return res;
          } catch (err) {
            if (isInitializationOrConnectionError(err)) {
              if (!globalForPrisma.mockDb) {
                globalForPrisma.mockDb = loadMockPrismaClient();
              }
              const mockDelegate = (
                globalForPrisma.mockDb as unknown as Record<string | symbol, Record<string | symbol, unknown>>
              )[modelName];
              const mockFn = mockDelegate?.[methodProp];
              if (typeof mockFn === "function") {
                return mockFn.apply(mockDelegate, args);
              }
            }
            throw err;
          }
        };
      },
    });
  }
  return delegate;
}

export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (process.env.NODE_ENV !== "production" && globalForPrisma.mockDb) {
      const mockVal = (globalForPrisma.mockDb as unknown as Record<string | symbol, unknown>)[prop];
      if (typeof mockVal === "function") {
        return mockVal.bind(globalForPrisma.mockDb);
      }
      return mockVal;
    }
    const client = getClient();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    if (val && typeof val === "object") {
      return wrapModelDelegate(val as Record<string | symbol, unknown>, prop);
    }
    return val;
  },
});

let schemaSyncPromise: Promise<void> | null = null;

/**
 * Idempotently ensures additive columns, tables, and enum values exist in PostgreSQL.
 * Safe to call on P2022/P2021 errors when an existing database has not yet run latest migrations.
 */
export function ensureAdditiveSchema(): Promise<void> {
  if (schemaSyncPromise) return schemaSyncPromise;

  schemaSyncPromise = (async () => {
    const client = getClient() as unknown as {
      $executeRawUnsafe?: (sql: string) => Promise<unknown>;
    };
    if (typeof client.$executeRawUnsafe !== "function") return;

    const statements = [
      `CREATE TABLE IF NOT EXISTS "pending_registrations" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "codeHash" TEXT NOT NULL,
        "attempts" INTEGER NOT NULL DEFAULT 0,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "pending_registrations_pkey" PRIMARY KEY ("id")
      );`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "pending_registrations_email_key" ON "pending_registrations"("email");`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'CUSTOMER';`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "whatsapp" TEXT;`,
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "contactEmail" TEXT;`,
      `ALTER TABLE "verification_tokens" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "originalPrice" DECIMAL(10,2);`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "userId" TEXT;`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "applicationStatus" TEXT NOT NULL DEFAULT 'approved';`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[];`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "experience" TEXT;`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "portfolioUrl" TEXT;`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "githubUrl" TEXT;`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "linkedinUrl" TEXT;`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "solutionsOffered" TEXT;`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "expertiseAreas" TEXT;`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "location" TEXT;`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT NOT NULL DEFAULT 'not_required';`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT;`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "verificationNotes" TEXT;`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "verificationDocumentUrl" TEXT;`,
      `ALTER TYPE "NotificationStatus" ADD VALUE IF NOT EXISTS 'THROTTLED';`,
      `ALTER TABLE "custom_project_requests" ADD COLUMN IF NOT EXISTS "customerId" TEXT;`,
      `ALTER TABLE "custom_project_requests" ADD COLUMN IF NOT EXISTS "linkedAt" TIMESTAMP(3);`,
      `ALTER TABLE "custom_project_requests" ADD COLUMN IF NOT EXISTS "notificationStatus" "NotificationStatus" NOT NULL DEFAULT 'PENDING';`,
      `CREATE INDEX IF NOT EXISTS "custom_project_requests_customerId_idx" ON "custom_project_requests"("customerId");`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "removedAt" TIMESTAMP(3);`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "removedById" TEXT;`,
      `ALTER TABLE "project_providers" ADD COLUMN IF NOT EXISTS "removalReason" TEXT;`,
      `CREATE INDEX IF NOT EXISTS "project_providers_removedAt_idx" ON "project_providers"("removedAt");`,
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "featuredOrder" INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "moderationNote" TEXT;`,
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "moderatedAt" TIMESTAMP(3);`,
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "moderatedById" TEXT;`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DealType') THEN CREATE TYPE "DealType" AS ENUM ('NONE', 'LIMITED_DEAL', 'LAUNCH_OFFER', 'FESTIVE_SALE', 'EARLY_BIRD', 'CLEARANCE', 'CUSTOM'); END IF; END $$;`,
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PriceQualifier') THEN CREATE TYPE "PriceQualifier" AS ENUM ('NONE', 'STARTING_FROM', 'NEGOTIABLE'); END IF; END $$;`,
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "priceQualifier" "PriceQualifier" NOT NULL DEFAULT 'NONE';`,
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "dealType" "DealType" NOT NULL DEFAULT 'NONE';`,
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "dealLabel" TEXT;`,
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "dealStartsAt" TIMESTAMP(3);`,
      `ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "dealEndsAt" TIMESTAMP(3);`,
    ];

    for (const sql of statements) {
      try {
        await client.$executeRawUnsafe(sql);
      } catch {
        // Ignore individual statement errors (e.g. read-only replica or already applied)
      }
    }
  })();

  return schemaSyncPromise;
}

export default db;
