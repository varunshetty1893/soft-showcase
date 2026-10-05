// app/api/user/password/route.ts
// Direct password update endpoint for logged-in user or admin.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { z } from "zod";

const ChangePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password is too long")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user from DB with passwordHash and tokenVersion
    const dbUser = await db.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Sensitive route check: verify tokenVersion against DB on every call (M6)
    const sessionTokenVersion = (sessionUser as { tokenVersion?: number }).tokenVersion ?? 0;
    if (sessionTokenVersion !== (dbUser.tokenVersion ?? 0)) {
      return NextResponse.json(
        { error: "Session expired or invalidated. Please sign in again." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const result = ChangePasswordSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = result.data;

    // If user already has a password set, verify current password
    if (dbUser.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password." },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "Current password is incorrect." },
          { status: 400 }
        );
      }
    }

    // Hash and update new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: sessionUser.id },
        data: {
          passwordHash: newPasswordHash,
          tokenVersion: { increment: 1 },
          emailVerified: dbUser.emailVerified || new Date(),
        },
      });

      // Clear any persisted active sessions (M6)
      await tx.session.deleteMany({
        where: { userId: sessionUser.id },
      });

      await tx.auditLog.create({
        data: {
          userId: sessionUser.id,
          action: "PASSWORD_CHANGED",
          entityType: "User",
          entityId: sessionUser.id,
          details: { email: dbUser.email },
        },
      }).catch(() => null);
    });

    return NextResponse.json({
      success: true,
      message: "Password updated successfully! Please sign in again with your new password.",
      requiresSignIn: true,
    });
  } catch (error) {
    console.error("[API] Change password error:", error);
    return NextResponse.json(
      { error: "Failed to update password. Please try again." },
      { status: 500 }
    );
  }
}

export const PATCH = POST;

