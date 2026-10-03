ALTER TABLE "pending_registrations"
ADD COLUMN IF NOT EXISTS "partnerApplication" JSONB;
