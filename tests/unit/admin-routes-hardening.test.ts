// tests/unit/admin-routes-hardening.test.ts
// Regression tests for admin API hardening:
//  - partner status endpoint persists adminNotes + audits atomically
//  - transaction verification is cleanly reversible
//  - bulk project update uses a strict allow-list and never reports success for unknown ids
//  - image reorder / image update validate their input

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/auth/session", () => {
  class AuthError extends Error {
    status = 401;
  }
  return {
    AuthError,
    authErrorResponse: vi.fn(),
    requireAdmin: vi.fn().mockResolvedValue({ user: { id: "admin-1" } }),
  };
});

vi.mock("@/lib/db/audit", () => ({
  writeAuditLog: vi.fn().mockResolvedValue(undefined),
  createAuditLogTx: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/storage/storage-service", () => ({
  deleteImage: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/db/client", () => ({
  ensureAdditiveSchema: vi.fn().mockResolvedValue(undefined),
  db: {
    $transaction: vi.fn(),
    projectProvider: { findUnique: vi.fn(), update: vi.fn() },
    project: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    projectImage: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    category: { findUnique: vi.fn() },
    transaction: { findUnique: vi.fn(), update: vi.fn() },
    user: { updateMany: vi.fn() },
  },
}));

import { db } from "@/lib/db/client";
import { createAuditLogTx } from "@/lib/db/audit";
import { PATCH as statusPatch } from "@/app/api/admin/providers/[id]/status/route";
import { PATCH as transactionPatch } from "@/app/api/admin/transactions/[id]/route";
import { POST as bulkPost } from "@/app/api/admin/projects/bulk/route";
import { PUT as reorderPut } from "@/app/api/admin/projects/[id]/images/reorder/route";
import { PATCH as imagePatch } from "@/app/api/admin/projects/[id]/images/[imageId]/route";

function jsonReq(url: string, method: string, body: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const dbAny = db as any;

beforeEach(() => {
  vi.clearAllMocks();
  dbAny.$transaction.mockImplementation(async (arg: any) =>
    typeof arg === "function" ? arg(dbAny) : Promise.all(arg)
  );
});

describe("Partner status endpoint", () => {
  const params = { params: Promise.resolve({ id: "prov-1" }) };

  const existingProvider = {
    id: "prov-1",
    displayName: "Acme",
    applicationStatus: "pending",
    verificationStatus: "pending",
    isActive: false,
    removedAt: null,
  };

  it("persists adminNotes on the provider record and writes the audit row in the same transaction", async () => {
    dbAny.projectProvider.findUnique.mockResolvedValue(existingProvider);
    dbAny.projectProvider.update.mockResolvedValue({
      id: "prov-1",
      userId: "user-1",
      verificationStatus: "rejected",
    });
    dbAny.project.updateMany.mockResolvedValue({ count: 1 });
    dbAny.user.updateMany.mockResolvedValue({ count: 1 });

    const res = await statusPatch(
      jsonReq("/api/admin/providers/prov-1/status", "PATCH", {
        applicationStatus: "rejected",
        verificationStatus: "rejected",
        rejectionReason: "Incomplete profile",
        adminNotes: "Called them, no response",
      }),
      params
    );

    expect(res.status).toBe(200);
    const updateArg = dbAny.projectProvider.update.mock.calls[0][0];
    expect(updateArg.data.adminNotes).toBe("Called them, no response");
    expect(updateArg.data.isActive).toBe(false);
    expect(createAuditLogTx).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "PARTNER_REJECTED", entityId: "prov-1" })
    );
  });

  it("returns 404 for an unknown provider and 409 for a removed one", async () => {
    dbAny.projectProvider.findUnique.mockResolvedValueOnce(null);
    const missing = await statusPatch(
      jsonReq("/api/admin/providers/prov-1/status", "PATCH", { applicationStatus: "approved" }),
      params
    );
    expect(missing.status).toBe(404);

    dbAny.projectProvider.findUnique.mockResolvedValueOnce({
      ...existingProvider,
      removedAt: new Date(),
    });
    const removed = await statusPatch(
      jsonReq("/api/admin/providers/prov-1/status", "PATCH", { applicationStatus: "approved" }),
      params
    );
    expect(removed.status).toBe(409);
    expect(dbAny.projectProvider.update).not.toHaveBeenCalled();
  });
});

describe("Transaction verification", () => {
  const params = { params: Promise.resolve({ id: "tx-1" }) };

  it("clears verifiedAt/verifiedBy when a verified transaction is moved back", async () => {
    dbAny.transaction.findUnique.mockResolvedValue({
      id: "tx-1",
      paymentStatus: "VERIFIED",
      verifiedAt: new Date("2026-01-01"),
      verifiedBy: "admin-0",
    });
    dbAny.transaction.update.mockResolvedValue({ id: "tx-1", transactionNumber: "T-1" });

    const res = await transactionPatch(
      jsonReq("/api/admin/transactions/tx-1", "PATCH", { paymentStatus: "DISPUTED" }),
      params
    );

    expect(res.status).toBe(200);
    const data = dbAny.transaction.update.mock.calls[0][0].data;
    expect(data.verifiedAt).toBeNull();
    expect(data.verifiedBy).toBeNull();
  });

  it("stamps verifier once when entering a verified state and keeps it between VERIFIED and COMPLETED", async () => {
    dbAny.transaction.update.mockResolvedValue({ id: "tx-1", transactionNumber: "T-1" });

    dbAny.transaction.findUnique.mockResolvedValueOnce({
      id: "tx-1",
      paymentStatus: "UNDER_REVIEW",
      verifiedAt: null,
      verifiedBy: null,
    });
    await transactionPatch(
      jsonReq("/api/admin/transactions/tx-1", "PATCH", { paymentStatus: "VERIFIED" }),
      params
    );
    const entering = dbAny.transaction.update.mock.calls[0][0].data;
    expect(entering.verifiedBy).toBe("admin-1");
    expect(entering.verifiedAt).toBeInstanceOf(Date);

    dbAny.transaction.findUnique.mockResolvedValueOnce({
      id: "tx-1",
      paymentStatus: "VERIFIED",
      verifiedAt: new Date("2026-01-01"),
      verifiedBy: "admin-0",
    });
    await transactionPatch(
      jsonReq("/api/admin/transactions/tx-1", "PATCH", { paymentStatus: "COMPLETED" }),
      params
    );
    const staying = dbAny.transaction.update.mock.calls[1][0].data;
    expect(staying).not.toHaveProperty("verifiedAt");
    expect(staying).not.toHaveProperty("verifiedBy");
  });

  it("returns 404 when the transaction does not exist", async () => {
    dbAny.transaction.findUnique.mockResolvedValue(null);
    const res = await transactionPatch(
      jsonReq("/api/admin/transactions/tx-1", "PATCH", { paymentStatus: "VERIFIED" }),
      params
    );
    expect(res.status).toBe(404);
    expect(dbAny.transaction.update).not.toHaveBeenCalled();
  });
});

describe("Bulk project update", () => {
  const adminManagedProject = (id: string, extra: Record<string, unknown> = {}) => ({
    id,
    title: `Project ${id}`,
    status: "DRAFT",
    featured: false,
    featuredOrder: 0,
    categoryId: "cat-1",
    provider: {
      id: "prov-1",
      userId: null,
      user: null,
      isActive: true,
      applicationStatus: "approved",
      providerConsentConfirmed: true,
      removedAt: null,
    },
    ...extra,
  });

  it("returns 404 and writes nothing when any requested id does not exist", async () => {
    dbAny.project.findMany.mockResolvedValue([adminManagedProject("p1")]);

    const res = await bulkPost(
      jsonReq("/api/admin/projects/bulk", "POST", {
        projectIds: ["p1", "ghost"],
        patch: { featured: true },
      })
    );

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.missingProjectIds).toEqual(["ghost"]);
    expect(dbAny.project.update).not.toHaveBeenCalled();
  });

  it("rejects unknown fields instead of copying them into Prisma data", async () => {
    dbAny.project.findMany.mockResolvedValue([adminManagedProject("p1")]);

    const res = await bulkPost(
      jsonReq("/api/admin/projects/bulk", "POST", {
        projectIds: ["p1"],
        patch: { featured: true, providerId: "attacker-provider", price: 1 },
      })
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.disallowedFields).toEqual(expect.arrayContaining(["providerId", "price"]));
    expect(dbAny.project.update).not.toHaveBeenCalled();
  });

  it("applies only allow-listed fields and audits every changed project", async () => {
    dbAny.project.findMany.mockResolvedValue([adminManagedProject("p1"), adminManagedProject("p2")]);
    dbAny.project.update.mockImplementation(async ({ where, data }: any) => ({
      id: where.id,
      featured: data.featured ?? false,
      featuredOrder: data.featuredOrder ?? 0,
      status: "DRAFT",
      categoryId: "cat-1",
    }));

    const res = await bulkPost(
      jsonReq("/api/admin/projects/bulk", "POST", {
        // duplicate id must not cause a double update
        projectIds: ["p1", "p2", "p1"],
        patch: { featured: true, featuredOrder: 3 },
      })
    );

    expect(res.status).toBe(200);
    expect((await res.json()).updatedCount).toBe(2);
    expect(dbAny.project.update).toHaveBeenCalledTimes(2);
    expect(dbAny.project.update.mock.calls[0][0].data).toEqual({ featured: true, featuredOrder: 3 });
    expect(createAuditLogTx).toHaveBeenCalledTimes(2);
  });

  it("refuses to publish projects whose provider is not approved/consented", async () => {
    dbAny.project.findMany.mockResolvedValue([
      adminManagedProject("p1", {
        provider: {
          id: "prov-1",
          userId: null,
          user: null,
          isActive: true,
          applicationStatus: "pending",
          providerConsentConfirmed: false,
          removedAt: null,
        },
      }),
    ]);

    const res = await bulkPost(
      jsonReq("/api/admin/projects/bulk", "POST", {
        projectIds: ["p1"],
        patch: { status: "PUBLISHED" },
      })
    );

    expect(res.status).toBe(422);
    expect(dbAny.project.update).not.toHaveBeenCalled();
  });
});

describe("Image reorder & update validation", () => {
  const params = { params: Promise.resolve({ id: "proj-1" }) };

  it("rejects duplicate ids, empty lists and non-string entries", async () => {
    for (const imageIds of [["a", "a"], [], ["a", 5], "nope"]) {
      const res = await reorderPut(
        jsonReq("/api/admin/projects/proj-1/images/reorder", "PUT", { imageIds }),
        params
      );
      expect(res.status).toBe(400);
    }
    expect(dbAny.projectImage.updateMany).not.toHaveBeenCalled();
  });

  it("rejects ids that do not belong to the project", async () => {
    dbAny.project.findUnique.mockResolvedValue({ id: "proj-1", slug: "demo" });
    dbAny.projectImage.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }]);

    const res = await reorderPut(
      jsonReq("/api/admin/projects/proj-1/images/reorder", "PUT", { imageIds: ["b", "zzz"] }),
      params
    );
    expect(res.status).toBe(400);
    expect(dbAny.projectImage.updateMany).not.toHaveBeenCalled();
  });

  it("writes contiguous unique sortOrder, keeping unlisted images after the listed ones", async () => {
    dbAny.project.findUnique.mockResolvedValue({ id: "proj-1", slug: "demo" });
    dbAny.projectImage.findMany.mockResolvedValue([{ id: "a" }, { id: "b" }, { id: "c" }]);
    dbAny.projectImage.updateMany.mockResolvedValue({ count: 1 });

    const res = await reorderPut(
      jsonReq("/api/admin/projects/proj-1/images/reorder", "PUT", { imageIds: ["c", "a"] }),
      params
    );

    expect(res.status).toBe(200);
    const writes = dbAny.projectImage.updateMany.mock.calls.map((c: any) => [
      c[0].where.id,
      c[0].data.sortOrder,
    ]);
    expect(writes).toEqual([
      ["c", 0],
      ["a", 1],
      ["b", 2],
    ]);
  });

  it("returns 400 (not a 500) for a non-numeric sortOrder on image update", async () => {
    const res = await imagePatch(
      jsonReq("/api/admin/projects/proj-1/images/img-1", "PATCH", { sortOrder: "abc" }),
      { params: Promise.resolve({ id: "proj-1", imageId: "img-1" }) }
    );
    expect(res.status).toBe(400);
    expect(dbAny.projectImage.findUnique).not.toHaveBeenCalled();
  });
});
