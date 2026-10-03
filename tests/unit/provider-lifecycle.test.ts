// tests/unit/provider-lifecycle.test.ts
// Unit tests for Phase 2 — Provider management:
// - 2A: State-aware toggle button matrix, self-lockout protection, compare-and-set conflict
// - 2B: Soft remove, public query helpers (publicProviderWhere / publicProjectWhere),
//       restore, and permanent delete blocked when inquiries/transactions/tickets exist

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/client", () => ({
  ensureAdditiveSchema: vi.fn().mockResolvedValue(undefined),
  db: {
    projectProvider: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    supportTicket: {
      count: vi.fn(),
    },
    projectImage: {
      deleteMany: vi.fn(),
    },
    project: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/db/audit", () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
  createAuditLogTx: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/email/email-service", () => ({
  sendPartnerRemovedEmail: vi.fn().mockResolvedValue(undefined),
}));

import { db } from "@/lib/db/client";
import { writeAuditLog, createAuditLogTx } from "@/lib/db/audit";
import {
  getProviderStatusButtonSpec,
  toggleProviderActiveState,
  removeProvider,
  restoreProvider,
  permanentlyDeleteProvider,
} from "@/lib/providers/provider-lifecycle";
import {
  publicProviderWhere,
  publicProjectWhere,
} from "@/lib/db/queries/public-filters";

describe("Phase 2 — Provider Management (Toggle & Remove/Restore/Delete)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db.user.update as any).mockResolvedValue({});
    (db.session.deleteMany as any).mockResolvedValue({ count: 1 });
    (db.supportTicket.count as any).mockResolvedValue(0);
  });

  describe("2A. Toggle State Matrix & Self-Lockout", () => {
    it("maps every provider state to the exact button label, action, and style", () => {
      // Active & Approved -> Deactivate (outline-danger)
      const activeApproved = getProviderStatusButtonSpec(
        {
          id: "p1",
          displayName: "Alpha Partner",
          email: "alpha@example.com",
          userId: "user-partner-1",
          isActive: true,
          applicationStatus: "approved",
          removedAt: null,
        },
        "admin-user-1"
      );
      expect(activeApproved).toMatchObject({
        state: "ACTIVE_APPROVED",
        label: "Deactivate",
        style: "outline-danger",
        disabled: false,
      });

      // Inactive (previously approved / deactivated) -> Activate (solid-success)
      const inactive = getProviderStatusButtonSpec(
        {
          id: "p2",
          displayName: "Beta Partner",
          email: "beta@example.com",
          userId: "user-partner-2",
          isActive: false,
          applicationStatus: "deactivated",
          removedAt: null,
        },
        "admin-user-1"
      );
      expect(inactive).toMatchObject({
        state: "INACTIVE",
        label: "Activate",
        style: "solid-success",
        disabled: false,
      });

      // Pending application -> Approve / Reject
      const pending = getProviderStatusButtonSpec(
        {
          id: "p3",
          displayName: "Gamma Partner",
          email: "gamma@example.com",
          userId: "user-partner-3",
          isActive: false,
          applicationStatus: "pending",
          removedAt: null,
        },
        "admin-user-1"
      );
      expect(pending.state).toBe("PENDING");
      expect(pending.label).toBe("Approve / Reject");

      // Rejected -> Re-approve
      const rejected = getProviderStatusButtonSpec(
        {
          id: "p4",
          displayName: "Delta Partner",
          email: "delta@example.com",
          userId: "user-partner-4",
          isActive: false,
          applicationStatus: "rejected",
          removedAt: null,
        },
        "admin-user-1"
      );
      expect(rejected.state).toBe("REJECTED");
      expect(rejected.label).toBe("Re-approve");

      // Removed -> Restore (outline)
      const removed = getProviderStatusButtonSpec(
        {
          id: "p5",
          displayName: "Removed Partner",
          email: "removed@example.com",
          userId: "user-partner-5",
          isActive: false,
          applicationStatus: "deactivated",
          removedAt: new Date("2026-04-01T00:00:00Z"),
        },
        "admin-user-1"
      );
      expect(removed).toMatchObject({
        state: "REMOVED",
        label: "Restore",
        style: "outline",
        disabled: false,
      });
    });

    it("disables toggle button with tooltip when provider is linked to the signed-in admin's own user", () => {
      const selfMeta = getProviderStatusButtonSpec(
        {
          id: "p-self",
          displayName: "Admin Own Provider",
          email: "admin@example.com",
          userId: "admin-user-1",
          isActive: true,
          applicationStatus: "approved",
          removedAt: null,
        },
        "admin-user-1"
      );

      expect(selfMeta.disabled).toBe(true);
      expect(selfMeta.disabledReason).toContain("own admin account");
      expect(selfMeta.canRemove).toBe(false);
    });

    it("detects compare-and-set conflict when another admin already flipped the provider state", async () => {
      (db.projectProvider.findUnique as any).mockResolvedValue({
        id: "p1",
        displayName: "Varun Shetty",
        userId: "partner-1",
        isActive: true,
        applicationStatus: "approved",
        removedAt: null,
      });

      // Simulate race condition where updateMany matches 0 rows because state changed concurrently
      (db.projectProvider.updateMany as any).mockResolvedValue({ count: 0 });

      const res = await toggleProviderActiveState({
        providerId: "p1",
        targetActive: false,
        reason: "Testing concurrent click",
        actorId: "admin-1",
      });

      expect(res.conflict).toBe(true);
      expect(res.ok).toBe(false);
      expect(res.message).toContain("already changed");
      expect(writeAuditLog).not.toHaveBeenCalled();
    });

    it("activates/deactivates via compare-and-set and logs PARTNER_DEACTIVATED with reason", async () => {
      (db.projectProvider.findUnique as any).mockResolvedValue({
        id: "p1",
        displayName: "Varun Shetty",
        userId: "partner-1",
        isActive: true,
        applicationStatus: "approved",
        removedAt: null,
      });
      (db.projectProvider.updateMany as any).mockResolvedValue({ count: 1 });

      const res = await toggleProviderActiveState({
        providerId: "p1",
        targetActive: false,
        reason: "Temporary maintenance hold",
        actorId: "admin-1",
      });

      expect(res.ok).toBe(true);
      expect(res.conflict).toBeUndefined();
      expect(writeAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "PARTNER_DEACTIVATED",
          entityId: "p1",
          metadata: expect.objectContaining({
            reason: "Temporary maintenance hold",
          }),
        })
      );
    });
  });

  describe("2B. Public Visibility Helpers, Soft Remove, Restore & Permanent Delete", () => {
    it("publicProviderWhere() and publicProjectWhere() exclude removed providers everywhere", () => {
      const provWhere = publicProviderWhere({ slug: "test" });
      expect(provWhere).toMatchObject({
        isActive: true,
        applicationStatus: "approved",
        removedAt: null,
        slug: "test",
      });

      const projWhere = publicProjectWhere({ featured: true });
      expect(projWhere).toMatchObject({
        status: "PUBLISHED",
        featured: true,
        provider: {
          isActive: true,
          applicationStatus: "approved",
          removedAt: null,
        },
      });
    });

    it("soft-removes a provider, invalidates partner sessions (tokenVersion increment), keeps user as customer without touching isAdmin, and logs PROVIDER_REMOVED", async () => {
      (db.projectProvider.findUnique as any).mockResolvedValue({
        id: "p-rem",
        displayName: "Acme Solutions",
        email: "acme@example.com",
        userId: "user-acme",
        isActive: true,
        applicationStatus: "approved",
        removedAt: null,
        _count: {
          projects: 4,
          inquiries: 2,
          transactions: 1,
        },
      });
      (db.supportTicket.count as any).mockResolvedValue(3);

      const txProviderUpdate = vi.fn().mockResolvedValue({
        id: "p-rem",
        displayName: "Acme Solutions",
        isActive: false,
        removedAt: new Date(),
      });
      const txProjectFindMany = vi
        .fn()
        .mockResolvedValue([{ id: "proj-a" }, { id: "proj-b" }]);
      const txProjectUpdateMany = vi.fn().mockResolvedValue({ count: 2 });
      (db.$transaction as any).mockImplementation(async (cb: any) =>
        cb({
          project: { findMany: txProjectFindMany, updateMany: txProjectUpdateMany },
          projectProvider: { update: txProviderUpdate },
        })
      );

      const res = await removeProvider({
        providerId: "p-rem",
        reason: "Policy violation",
        confirmName: "Acme Solutions",
        notifyPartner: false,
        actorId: "admin-1",
      });

      expect(res.ok).toBe(true);
      expect(txProviderUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "p-rem" },
          data: expect.objectContaining({
            isActive: false,
            removedById: "admin-1",
            removalReason: "Policy violation",
          }),
        })
      );

      // Published solutions are moved to DRAFT so a later restore cannot silently re-publish them.
      expect(txProjectFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { providerId: "p-rem", status: "PUBLISHED" } })
      );
      expect(txProjectUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ["proj-a", "proj-b"] } },
        data: { status: "DRAFT" },
      });

      // Verify user tokenVersion is incremented and role set to customer, and isAdmin is NEVER touched
      expect(db.user.update).toHaveBeenCalledTimes(1);
      const userUpdateCall = (db.user.update as any).mock.calls[0][0];
      expect(userUpdateCall.data).toEqual({
        role: "customer",
        tokenVersion: { increment: 1 },
      });
      expect(userUpdateCall.data).not.toHaveProperty("isAdmin");

      // Audit is written inside the same transaction.
      expect(createAuditLogTx).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          action: "PROVIDER_REMOVED",
          entityId: "p-rem",
          details: expect.objectContaining({
            reason: "Policy violation",
            draftedProjectIds: ["proj-a", "proj-b"],
            impactCounts: {
              projects: 4,
              inquiries: 2,
              transactions: 1,
              supportTickets: 3,
            },
          }),
        })
      );
    });

    it("restores a soft-removed provider and logs PROVIDER_RESTORED", async () => {
      (db.projectProvider.findUnique as any).mockResolvedValue({
        id: "p-rem",
        displayName: "Acme Solutions",
        email: "acme@example.com",
        userId: "user-acme",
        isActive: false,
        applicationStatus: "deactivated",
        removedAt: new Date("2026-03-01T00:00:00Z"),
        removedById: "admin-1",
        removalReason: "Old reason",
      });
      (db.projectProvider.update as any).mockResolvedValue({
        id: "p-rem",
        removedAt: null,
        removedById: null,
        removalReason: null,
        isActive: true,
        applicationStatus: "approved",
      });

      const res = await restoreProvider({
        providerId: "p-rem",
        actorId: "admin-1",
      });

      expect(res.ok).toBe(true);
      expect(db.projectProvider.update).toHaveBeenCalledWith({
        where: { id: "p-rem" },
        data: {
          removedAt: null,
          removedById: null,
          removalReason: null,
          isActive: true,
          applicationStatus: "approved",
        },
      });
      expect(writeAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "PROVIDER_RESTORED",
          entityId: "p-rem",
        })
      );
    });

    it("blocks permanent delete when inquiries, transactions, or support tickets exist", async () => {
      (db.projectProvider.findUnique as any).mockResolvedValue({
        id: "p-rem",
        displayName: "Acme Solutions",
        email: "acme@example.com",
        userId: "user-acme",
        removedAt: new Date("2026-03-01T00:00:00Z"),
        projects: [],
        _count: {
          projects: 1,
          inquiries: 2,
          transactions: 0,
        },
      });
      (db.supportTicket.count as any).mockResolvedValue(0);

      const res = await permanentlyDeleteProvider({
        providerId: "p-rem",
        confirmName: "Acme Solutions",
        actorId: "admin-1",
      });

      expect(res.ok).toBe(false);
      expect(res.status).toBe(409);
      expect(res.message).toContain("2 inquiries");
      expect(db.projectProvider.delete).not.toHaveBeenCalled();
    });

    it("rejects permanent delete when the confirmation name is blank or wrong", async () => {
      (db.projectProvider.findUnique as any).mockResolvedValue({
        id: "p-clean",
        displayName: "Clean Test Provider",
        email: "clean@example.com",
        userId: "user-clean",
        removedAt: new Date("2026-03-01T00:00:00Z"),
        projects: [],
        _count: { projects: 0, inquiries: 0, transactions: 0 },
      });

      for (const confirmName of ["", "   ", "Some Other Provider"]) {
        const res = await permanentlyDeleteProvider({
          providerId: "p-clean",
          confirmName,
          actorId: "admin-1",
        });
        expect(res.ok).toBe(false);
        expect(res.status).toBe(400);
      }
      expect(db.$transaction).not.toHaveBeenCalled();
      expect(createAuditLogTx).not.toHaveBeenCalled();
    });

    it("permanently deletes a removed provider with zero protected records and writes the PROVIDER_DELETED snapshot inside the transaction", async () => {
      (db.projectProvider.findUnique as any).mockResolvedValue({
        id: "p-clean",
        displayName: "Clean Test Provider",
        email: "clean@example.com",
        userId: "user-clean",
        removedAt: new Date("2026-03-01T00:00:00Z"),
        projects: [{ id: "proj-1", title: "P1", slug: "p1" }],
        _count: {
          projects: 1,
          inquiries: 0,
          transactions: 0,
        },
      });
      (db.supportTicket.count as any).mockResolvedValue(0);
      const txProviderDelete = vi.fn().mockResolvedValue({});
      (db.$transaction as any).mockImplementation(async (cb: any) => {
        return cb({
          projectImage: { deleteMany: vi.fn().mockResolvedValue({ count: 2 }) },
          project: { deleteMany: vi.fn().mockResolvedValue({ count: 1 }) },
          projectProvider: { delete: txProviderDelete },
        });
      });

      const res = await permanentlyDeleteProvider({
        providerId: "p-clean",
        confirmName: "clean test provider",
        actorId: "admin-1",
      });

      expect(res.ok).toBe(true);
      expect(txProviderDelete).toHaveBeenCalled();
      expect(createAuditLogTx).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          action: "PROVIDER_DELETED",
          entityId: "p-clean",
          details: expect.objectContaining({
            displayName: "Clean Test Provider",
            email: "clean@example.com",
            projectIds: ["proj-1"],
          }),
        })
      );
    });

    it("does not report success if the audit write fails (deletion is rolled back with it)", async () => {
      (db.projectProvider.findUnique as any).mockResolvedValue({
        id: "p-clean",
        displayName: "Clean Test Provider",
        email: "clean@example.com",
        userId: null,
        removedAt: new Date("2026-03-01T00:00:00Z"),
        projects: [],
        _count: { projects: 0, inquiries: 0, transactions: 0 },
      });
      (createAuditLogTx as any).mockRejectedValueOnce(new Error("audit down"));
      (db.$transaction as any).mockImplementation(async (cb: any) =>
        cb({
          projectImage: { deleteMany: vi.fn() },
          project: { deleteMany: vi.fn() },
          projectProvider: { delete: vi.fn().mockResolvedValue({}) },
        })
      );

      await expect(
        permanentlyDeleteProvider({
          providerId: "p-clean",
          confirmName: "Clean Test Provider",
          actorId: "admin-1",
        })
      ).rejects.toThrow("audit down");
    });
  });
});
