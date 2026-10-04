// app/api/admin/users/[id]/route.ts
// Admin User Management — read, update role/admin flag, and revoke sessions.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { createAuditLog } from "@/lib/db/audit";
import { getUserById } from "@/lib/db/queries/users";

// GET single user
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(true);
    const { id } = await params;
    const user = await getUserById(id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — update role, isAdmin, or revoke sessions
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(true);
    const { id } = await params;
    const actorId = session.user.id;

    const body = await req.json();
    const { action, role, isAdmin: makeAdmin, reason } = body as {
      action: "set_role" | "make_admin" | "remove_admin" | "revoke_sessions" | "delete_account";
      role?: string;
      isAdmin?: boolean;
      reason?: string;
    };

    // Cannot modify yourself
    if (id === actorId) {
      return NextResponse.json({ error: "You cannot modify your own account here." }, { status: 400 });
    }

    const target = await db.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let result: any;
    let auditAction = "";
    let auditDetails: Record<string, unknown> = {};

    switch (action) {
      case "set_role": {
        const allowed = ["customer", "solution_partner", "admin"];
        if (!role || !allowed.includes(role)) {
          return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }
        result = await db.user.update({
          where: { id },
          data: { role, isAdmin: role === "admin" },
        });

        // Keep ProjectProvider in sync with solution_partner role
        if (role === "solution_partner") {
          const existing = await db.projectProvider.findFirst({
            where: { OR: [{ userId: id }, { email: target.email }] },
          });

          if (existing) {
            await db.projectProvider.update({
              where: { id: existing.id },
              data: {
                userId: id,
                isActive: true,
                applicationStatus: "approved",
                verificationStatus: existing.verificationStatus === "rejected" ? "not_required" : existing.verificationStatus,
                removedAt: null,
                removedById: null,
                removalReason: null,
              },
            });
          } else {
            await db.projectProvider.create({
              data: {
                userId: id,
                displayName: target.name || target.email.split("@")[0],
                email: target.email,
                whatsappNumber: target.whatsapp || null,
                isActive: true,
                applicationStatus: "approved",
                verificationStatus: "verified",
                approvedAt: new Date(),
                approvedBy: actorId,
              },
            });
          }
        } else if (role === "customer" && target.role === "solution_partner") {
          const existing = await db.projectProvider.findFirst({
            where: { OR: [{ userId: id }, { email: target.email }] },
          });
          if (existing) {
            await db.projectProvider.update({
              where: { id: existing.id },
              data: {
                isActive: false,
                applicationStatus: "deactivated",
              },
            });
          }
        }

        auditAction = "USER_ROLE_UPDATED";
        auditDetails = { prevRole: target.role, newRole: role, reason };
        break;
      }

      case "make_admin": {
        result = await db.user.update({
          where: { id },
          data: { role: "admin", isAdmin: true },
        });
        auditAction = "USER_MADE_ADMIN";
        auditDetails = { email: target.email, reason };
        break;
      }

      case "remove_admin": {
        result = await db.user.update({
          where: { id },
          data: { role: "customer", isAdmin: false },
        });
        auditAction = "USER_ADMIN_REVOKED";
        auditDetails = { email: target.email, reason };
        break;
      }

      case "revoke_sessions": {
        // Increment tokenVersion to invalidate all JWTs and delete all DB sessions
        await db.$transaction([
          db.user.update({
            where: { id },
            data: { tokenVersion: { increment: 1 } },
          }),
          db.session.deleteMany({ where: { userId: id } }),
        ]);
        result = { id, sessionsRevoked: true };
        auditAction = "USER_SESSIONS_REVOKED";
        auditDetails = { email: target.email, reason };
        break;
      }

      case "delete_account": {
        // Safety: block deleting admins directly
        if (target.isAdmin) {
          return NextResponse.json(
            { error: "Remove admin privileges before deleting an admin account." },
            { status: 400 }
          );
        }
        await db.user.delete({ where: { id } });
        result = { id, deleted: true };
        auditAction = "USER_ACCOUNT_DELETED";
        auditDetails = { email: target.email, reason };
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    // Write audit log
    await createAuditLog({
      userId: actorId,
      action: auditAction,
      entityType: "User",
      entityId: id,
      details: auditDetails,
    });

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error("[admin/users/[id] PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
