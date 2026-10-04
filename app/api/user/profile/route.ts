// app/api/user/profile/route.ts
// Customer profile update endpoint.
// Allows authenticated users to update their profile settings (name, whatsapp, contactEmail).

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { createAuditLog } from "@/lib/db/audit";
import { isValidPhone, normalizeToE164 } from "@/lib/utils/phone";
import { z } from "zod";

const ProfileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  whatsapp: z.string().trim().optional().nullable().or(z.literal("")),
  contactEmail: z
    .string()
    .trim()
    .email("Please enter a valid contact email address")
    .max(255)
    .optional()
    .nullable()
    .or(z.literal("")),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        contactEmail: true,
        image: true,
        isAdmin: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error("[API] Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = ProfileUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = result.data;
    const updateData: {
      name?: string;
      whatsapp?: string | null;
      contactEmail?: string | null;
    } = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.whatsapp !== undefined) {
      if (data.whatsapp && data.whatsapp.trim()) {
        if (!isValidPhone(data.whatsapp)) {
          return NextResponse.json(
            {
              error: "Please enter a valid phone number with country code (e.g. +91 98765 43210)",
            },
            { status: 400 }
          );
        }
        updateData.whatsapp = normalizeToE164(data.whatsapp);
      } else {
        updateData.whatsapp = null;
      }
    }

    if (data.contactEmail !== undefined) {
      if (data.contactEmail && data.contactEmail.trim()) {
        updateData.contactEmail = data.contactEmail.trim().toLowerCase();
      } else {
        updateData.contactEmail = null;
      }
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        whatsapp: true,
        contactEmail: true,
        image: true,
        isAdmin: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[API] Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile. Please try again later." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user?.id || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const confirmEmail = String(body.confirmEmail || "").trim().toLowerCase();
    const reason = String(body.reason || "").trim();

    if (confirmEmail !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Please enter your exact email address to confirm account deletion." },
        { status: 400 }
      );
    }

    // Safety: prevent platform admins from self-deleting via customer portal
    const targetUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, isAdmin: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.isAdmin) {
      return NextResponse.json(
        { error: "Admin accounts cannot be self-deleted. Please revoke admin status from the admin console first." },
        { status: 403 }
      );
    }

    const userId = targetUser.id;
    const userEmail = targetUser.email;

    // Find any partner profile associated with this user or email
    const providers = await db.projectProvider.findMany({
      where: {
        OR: [{ userId }, { email: userEmail }],
      },
      select: { id: true },
    });

    const providerIds = providers.map((p) => p.id);

    // Safely disassociate or clean up foreign relations
    await db.$transaction([
      // Disassociate customer records so personal identity is removed from audit trails
      db.inquiry.updateMany({
        where: { customerId: userId },
        data: { customerId: null },
      }),
      db.customProjectRequest.updateMany({
        where: { customerId: userId },
        data: { customerId: null },
      }),
      db.transaction.updateMany({
        where: { customerId: userId },
        data: { customerId: null },
      }),
      // Archive all published/draft projects of this partner so they are unlisted
      ...(providerIds.length > 0
        ? [
            db.project.updateMany({
              where: { providerId: { in: providerIds } },
              data: { status: "ARCHIVED" },
            }),
          ]
        : []),
      // Retire partner profiles and free email unique constraint so re-registering starts 100% fresh
      db.projectProvider.updateMany({
        where: {
          OR: [{ userId }, { email: userEmail }],
        },
        data: {
          userId: null,
          isActive: false,
          applicationStatus: "deactivated",
          removedAt: new Date(),
          removalReason: reason || "User initiated self-deletion",
        },
      }),
      db.supportTicket.deleteMany({
        where: { requesterId: userId },
      }),
      db.session.deleteMany({
        where: { userId },
      }),
      db.account.deleteMany({
        where: { userId },
      }),
      db.user.delete({
        where: { id: userId },
      }),
    ]);

    // Free up email in projectProvider records so if the user re-registers with the same email, it never collides
    for (const p of providers) {
      await db.projectProvider.update({
        where: { id: p.id },
        data: {
          email: `archived_${Date.now()}_${p.id}@archived.local`,
        },
      }).catch(() => null);
    }

    // Record audit log entry
    await createAuditLog({
      userId: null,
      action: "USER_SELF_DELETED",
      entityType: "User",
      entityId: userId,
      details: {
        email: userEmail,
        reason: reason || "User initiated self-deletion from account settings",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your account and all associated data have been permanently deleted.",
    });
  } catch (error) {
    console.error("[API] Error deleting user account:", error);
    return NextResponse.json(
      { error: "Failed to delete account. Please try again or contact support." },
      { status: 500 }
    );
  }
}

