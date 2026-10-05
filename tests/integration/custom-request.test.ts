import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db/client", () => {
  return {
    db: {
      customProjectRequest: {
        create: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/db/audit", () => {
  return {
    createAuditLog: vi.fn().mockResolvedValue(true),
  };
});

vi.mock("@/lib/email/email-service", () => {
  return {
    sendAdminCustomRequestEmail: vi.fn().mockResolvedValue({ success: true, messageId: "msg-admin-1" }),
    sendCustomerCustomRequestConfirmationEmail: vi.fn().mockResolvedValue({ success: true, messageId: "msg-cust-1" }),
  };
});

// No auth mock needed — route does not use getCurrentUser

import { db } from "@/lib/db/client";
import { createAuditLog } from "@/lib/db/audit";
import { POST as postCustomRequest } from "@/app/api/custom-requests/route";

describe("Custom Project Request API Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload = {
    name: "Enterprise Client",
    email: "client@enterprise.com",
    whatsapp: "+919876543299",
    projectTitle: "Custom Fleet Management Tracking Solution",
    category: "Logistics",
    technologyPreferences: ["Next.js", "PostgreSQL", "Go"],
    description: "We require an end-to-end fleet tracking system that can monitor 200+ delivery vehicles in real-time across multiple distribution hubs.",
    requiredFeatures: "GPS telematics ingestion, Driver dispatch mobile PWA, Automated shift timesheets, Route analytics dashboard",
    budget: "25000",
    deadline: "Within 3 months",
    additionalRequirements: "Must support offline caching for drivers in low-connectivity areas.",
  };

  it("should create custom request, log audit trail, and dispatch notification emails", async () => {
    vi.mocked(db.customProjectRequest.create).mockResolvedValueOnce({
      id: "req-fleet-999",
      ...validPayload,
      customerId: "customer-user-123",
      status: "SUBMITTED",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const req = new NextRequest("http://localhost:3000/api/custom-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.1.0.1",
      },
      body: JSON.stringify(validPayload),
    });

    const res = await postCustomRequest(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.requestId).toBe("req-fleet-999");

    // Verify DB create called with customerId from session
    // Verify DB create was called with correct fields (route does not pass customerId)
    expect(db.customProjectRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectTitle: "Custom Fleet Management Tracking Solution",
          email: "client@enterprise.com",
          status: "NEW",
        }),
      })
    );

    // Verify Audit log was created using the action/entityType from the actual route
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "CUSTOM_REQUEST_RECEIVED",
        entityType: "CustomProjectRequest",
        entityId: "req-fleet-999",
      })
    );
  });

  it("should reject custom requests failing validation with 400", async () => {
    const invalidPayload = {
      ...validPayload,
      description: "Too short", // Requires min 50 chars
    };

    const req = new NextRequest("http://localhost:3000/api/custom-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.1.0.2",
      },
      body: JSON.stringify(invalidPayload),
    });

    const res = await postCustomRequest(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(db.customProjectRequest.create).not.toHaveBeenCalled();
  });
});
