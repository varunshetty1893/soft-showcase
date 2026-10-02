-- Additive migration for Phase 5: Audit Log searchText column, indexes, and one-time backfill

ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "searchText" TEXT;

CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX IF NOT EXISTS "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "audit_logs_userId_idx" ON "audit_logs"("userId");

-- One-time backfill of searchText for existing audit_logs rows with a linked user
UPDATE "audit_logs" AS a
SET "searchText" = LOWER(
  TRIM(
    CONCAT_WS(
      ' ',
      COALESCE(a."action", ''),
      COALESCE(a."entityType", ''),
      COALESCE(a."entityId", ''),
      COALESCE(a."userId", 'system'),
      COALESCE(u."name", ''),
      COALESCE(u."email", ''),
      COALESCE(a."details"::text, '')
    )
  )
)
FROM "users" AS u
WHERE a."userId" = u."id" AND a."searchText" IS NULL;

-- One-time backfill of searchText for system / unlinked audit_logs rows
UPDATE "audit_logs"
SET "searchText" = LOWER(
  TRIM(
    CONCAT_WS(
      ' ',
      COALESCE("action", ''),
      COALESCE("entityType", ''),
      COALESCE("entityId", ''),
      COALESCE("userId", 'system'),
      COALESCE("details"::text, '')
    )
  )
)
WHERE "searchText" IS NULL;
