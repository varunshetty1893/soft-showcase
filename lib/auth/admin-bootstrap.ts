// lib/auth/admin-bootstrap.ts
// Server-only verified-email admin bootstrap hook.
// Separated from lib/auth/admin.ts to keep lib/auth/admin.ts 100% edge-safe for middleware.

import { db } from "@/lib/db/client";
import { isConfiguredAdminEmail } from "@/lib/auth/admin";

/**
 * Bootstrap Admin Hook:
 * Runs ONLY when a user's email is confirmed verified (via OTP verification or verified Google OAuth).
 * If the email matches the configured admin email list, elevates the user to admin in the database once.
 * Never elevates an unverified email.
 */
export async function bootstrapAdminOnVerification(userId: string, verifiedEmail: string): Promise<boolean> {
  if (!userId || !verifiedEmail) return false;
  const normalized = verifiedEmail.trim().toLowerCase();

  if (isConfiguredAdminEmail(normalized)) {
    try {
      await db.user.update({
        where: { id: userId },
        data: {
          isAdmin: true,
          role: "admin",
          emailVerified: new Date(),
        },
      });
      return true;
    } catch (e) {
      console.error("[Auth] Failed to bootstrap admin flag for verified user:", e);
      return false;
    }
  }

  return false;
}
