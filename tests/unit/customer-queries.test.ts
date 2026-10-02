import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/client", () => {
  return {
    db: {
      inquiry: {
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        count: vi.fn().mockResolvedValue(0),
      },
      customProjectRequest: {
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        count: vi.fn().mockResolvedValue(0),
      },
      transaction: {
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    },
  };
});

import { db } from "@/lib/db/client";
import {
  getCustomerInquiries,
  getCustomerRequests,
  linkVerifiedUserRecords,
} from "@/lib/db/queries/customer";
import { getCustomerTransactions } from "@/lib/db/queries/transactions";

describe("Customer Account Scoping & Verified Record Linking (B5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scopes getCustomerInquiries strictly by customerId with no email fallback", async () => {
    await getCustomerInquiries("user-123");
    expect(db.inquiry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customerId: "user-123" },
      })
    );
    expect(db.inquiry.updateMany).not.toHaveBeenCalled();
  });

  it("scopes getCustomerRequests strictly by customerId without read-time auto-linking", async () => {
    await getCustomerRequests("user-123");
    expect(db.customProjectRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customerId: "user-123" },
      })
    );
    expect(db.customProjectRequest.updateMany).not.toHaveBeenCalled();
  });

  it("scopes getCustomerTransactions strictly by customerId without read-time auto-linking", async () => {
    await getCustomerTransactions("user-123", "user@example.com");
    expect(db.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { customerId: "user-123" },
      })
    );
    expect(db.transaction.updateMany).not.toHaveBeenCalled();
  });

  it("links guest inquiries, custom requests, and transactions explicitly via linkVerifiedUserRecords", async () => {
    await linkVerifiedUserRecords("user-123", " Verified@Example.com ");

    expect(db.inquiry.updateMany).toHaveBeenCalledWith({
      where: { email: "verified@example.com", customerId: null },
      data: { customerId: "user-123" },
    });
    expect(db.customProjectRequest.updateMany).toHaveBeenCalledWith({
      where: { email: { equals: "verified@example.com", mode: "insensitive" }, customerId: null },
      data: { customerId: "user-123", linkedAt: expect.any(Date) },
    });
    expect(db.transaction.updateMany).toHaveBeenCalledWith({
      where: { customerEmail: "verified@example.com", customerId: null },
      data: { customerId: "user-123" },
    });
  });
});
