// app/api/auth/signout-everywhere/route.ts
// Invalidate all active sessions across all devices by incrementing user tokenVersion.
// Source of truth: M6 session invalidation architecture.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

export async function POST() {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.$transaction(async (tx) => {
      // 1. Increment tokenVersion in database to invalidate all existing JWTs
      await tx.user.update({
        where: { id: sessionUser.id },
        data: {
          tokenVersion: { increment: 1 },
        },
      });

      // 2. Clear any active database sessions
      await tx.session.deleteMany({
        where: { userId: sessionUser.id },
      });

      // 3. Audit trail
      await tx.auditLog.create({
        data: {
          userId: sessionUser.id,
          action: "SIGN_OUT_EVERYWHERE",
          entityType: "User",
          entityId: sessionUser.id,
          details: { reason: "User requested global session revocation" },
        },
      }).catch(() => null);
    });

    return NextResponse.json({
      success: true,
      message: "Successfully signed out of all devices and active sessions.",
    });
  } catch (error) {
    console.error("[Auth] Sign out everywhere error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while signing out." },
      { status: 500 }
    );
  }
}
