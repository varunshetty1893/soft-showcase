import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the db client before importing route handlers
vi.mock("@/lib/db/client", () => {
  return {
    db: {
      project: {
        findFirst: vi.fn(),
      },
      inquiry: {
        create: vi.fn(),
        update: vi.fn(),
      },
      projectProvider: {
        findUnique: vi.fn(),
      },
    },
  };
});

// Mock email service to prevent real email dispatches during test
vi.mock("@/lib/email/email-service", () => {
  return {
    sendProviderInquiryEmail: vi.fn().mockResolvedValue({ success: true, messageId: "mock-msg-1" }),
    sendCustomerConfirmationEmail: vi.fn().mockResolvedValue({ success: true, messageId: "mock-msg-2" }),
  };
});

// Mock auth session
vi.mock("@/lib/auth/session", () => {
  return {
    getCurrentUser: vi.fn().mockResolvedValue(null),
  };
});

import { db } from "@/lib/db/client";
import { GET as getWhatsAppRoute } from "@/app/api/projects/[slug]/whatsapp/route";
import { POST as postInquiryRoute } from "@/app/api/inquiries/route";

describe("Provider Contact Routing Integration Tests (Critical)", () => {
  const numberA = "919000000001";
  const numberB = "919000000002";

  const providerA = {
    id: "provider-alpha-id",
    displayName: "Varun (Provider Alpha)",
    email: "varun@provider-alpha.com",
    whatsappNumber: `+${numberA}`,
    showWhatsapp: true,
    showEmail: true,
    isActive: true,
    providerConsentConfirmed: true,
  };

  const providerB = {
    id: "provider-beta-id",
    displayName: "Rahul (Provider Beta)",
    email: "rahul@provider-beta.com",
    whatsappNumber: `+${numberB}`,
    showWhatsapp: true,
    showEmail: true,
    isActive: true,
    providerConsentConfirmed: true,
  };

  const projectA = {
    id: "project-alpha-id",
    title: "Project Alpha",
    slug: "project-alpha",
    status: "PUBLISHED",
    providerId: providerA.id,
    provider: providerA,
  };

  const projectB = {
    id: "project-beta-id",
    title: "Project Beta",
    slug: "project-beta",
    status: "PUBLISHED",
    providerId: providerB.id,
    provider: providerB,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Critical Test 1: Project A WhatsApp resolves to Provider A's WhatsApp number ONLY
  it("Project A WhatsApp resolves to Provider A number and NOT Provider B", async () => {
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(projectA as any);

    const req = new NextRequest("http://localhost:3000/api/projects/project-alpha/whatsapp", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });

    const res = await getWhatsAppRoute(req, {
      params: Promise.resolve({ slug: "project-alpha" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.url).toContain(numberA);
    expect(body.data.url).not.toContain(numberB);
  });

  // Critical Test 2: Project B WhatsApp resolves to Provider B's WhatsApp number ONLY
  it("Project B WhatsApp resolves to Provider B number and NOT Provider A", async () => {
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(projectB as any);

    const req = new NextRequest("http://localhost:3000/api/projects/project-beta/whatsapp", {
      headers: { "x-forwarded-for": "10.0.0.2" },
    });

    const res = await getWhatsAppRoute(req, {
      params: Promise.resolve({ slug: "project-beta" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.url).toContain(numberB);
    expect(body.data.url).not.toContain(numberA);
  });

  // Critical Test 3: Inquiry for Project A is associated with Provider A
  it("Inquiry for Project A is associated strictly with Provider A", async () => {
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(projectA as any);
    vi.mocked(db.inquiry.create).mockResolvedValueOnce({
      id: "inq-alpha-123",
      projectId: projectA.id,
      providerId: providerA.id,
      status: "NEW",
    } as any);

    const req = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.0.0.3",
      },
      body: JSON.stringify({
        projectId: projectA.id,
        name: "Test Customer",
        email: "customer@test.com",
        message: "I am interested in acquiring Project Alpha.",
        contactMethod: "EMAIL",
      }),
    });

    const res = await postInquiryRoute(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.inquiryId).toBe("inq-alpha-123");

    // Verify db.inquiry.create was called with Provider A's ID and NOT Provider B's ID
    expect(db.inquiry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: projectA.id,
          providerId: providerA.id,
          email: "customer@test.com",
        }),
      })
    );
  });

  // Critical Test 4: Inquiry for Project B is associated with Provider B
  it("Inquiry for Project B is associated strictly with Provider B", async () => {
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(projectB as any);
    vi.mocked(db.inquiry.create).mockResolvedValueOnce({
      id: "inq-beta-456",
      projectId: projectB.id,
      providerId: providerB.id,
      status: "NEW",
    } as any);

    const req = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.0.0.4",
      },
      body: JSON.stringify({
        projectId: projectB.id,
        name: "Test Customer Beta",
        email: "customer-beta@test.com",
        message: "I am interested in acquiring Project Beta.",
        contactMethod: "EMAIL",
      }),
    });

    const res = await postInquiryRoute(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(db.inquiry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          projectId: projectB.id,
          providerId: providerB.id,
        }),
      })
    );
  });

  // Critical Test 5: Customer cannot manipulate Provider Email or Provider ID
  it("Customer cannot inject provider_email or providerId into inquiry request", async () => {
    const maliciousPayload = {
      projectId: projectA.id,
      name: "Malicious Attacker",
      email: "attacker@exploit.com",
      message: "Testing client injection vulnerabilities in inquiry handler.",
      provider_email: "arbitrary-victim@target.com",
      providerId: providerB.id,
    };

    const req = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.0.0.5",
      },
      body: JSON.stringify(maliciousPayload),
    });

    const res = await postInquiryRoute(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");

    // Ensure database was never reached
    expect(db.inquiry.create).not.toHaveBeenCalled();
  });

  // Critical Test 6: Inactive provider cannot be contacted
  it("Rejects inquiry when project provider is inactive", async () => {
    const inactiveProviderProject = {
      ...projectA,
      provider: {
        ...providerA,
        isActive: false,
      },
    };

    vi.mocked(db.project.findFirst).mockResolvedValueOnce(inactiveProviderProject as any);

    const req = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.0.0.6",
      },
      body: JSON.stringify({
        projectId: projectA.id,
        name: "Test Customer",
        email: "customer@test.com",
        message: "Attempting to contact deactivated provider.",
      }),
    });

    const res = await postInquiryRoute(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("unavailable");
    expect(db.inquiry.create).not.toHaveBeenCalled();
  });

  // Critical Test 7: WhatsApp disabled on provider returns 403
  it("Rejects WhatsApp link generation if provider has showWhatsapp: false", async () => {
    const noWhatsAppProject = {
      ...projectA,
      provider: {
        ...providerA,
        showWhatsapp: false,
      },
    };

    vi.mocked(db.project.findFirst).mockResolvedValueOnce(noWhatsAppProject as any);

    const req = new NextRequest("http://localhost:3000/api/projects/project-alpha/whatsapp", {
      headers: { "x-forwarded-for": "10.0.0.7" },
    });

    const res = await getWhatsAppRoute(req, {
      params: Promise.resolve({ slug: "project-alpha" }),
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("not enabled");
  });

  // Critical Test 8: Unpublished/draft project returns 404
  it("Unpublished/draft project returns 404 for WhatsApp and inquiry endpoints", async () => {
    // When queried with status: "PUBLISHED", findFirst returns null for draft projects
    vi.mocked(db.project.findFirst).mockResolvedValueOnce(null);

    const waReq = new NextRequest("http://localhost:3000/api/projects/draft-slug/whatsapp", {
      headers: { "x-forwarded-for": "10.0.0.8" },
    });

    const waRes = await getWhatsAppRoute(waReq, {
      params: Promise.resolve({ slug: "draft-slug" }),
    });
    expect(waRes.status).toBe(404);

    vi.mocked(db.project.findFirst).mockResolvedValueOnce(null);

    const inqReq = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.0.0.9",
      },
      body: JSON.stringify({
        projectId: "draft-project-id",
        name: "Test Customer",
        email: "customer@test.com",
        message: "Attempting to contact draft project.",
      }),
    });

    const inqRes = await postInquiryRoute(inqReq);
    expect(inqRes.status).toBe(404);
  });

  // Critical Test 9: Unapproved provider (e.g. pending/suspended) cannot receive inquiries or WhatsApp redirects
  it("Rejects inquiry and WhatsApp redirect when provider applicationStatus is not approved", async () => {
    const pendingProviderProject = {
      ...projectA,
      provider: {
        ...providerA,
        applicationStatus: "pending",
      },
    };

    vi.mocked(db.project.findFirst).mockResolvedValueOnce(pendingProviderProject as any);

    const inqReq = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.0.0.10",
      },
      body: JSON.stringify({
        projectId: projectA.id,
        name: "Test Customer",
        email: "customer@test.com",
        message: "Attempting to contact pending provider.",
      }),
    });

    const inqRes = await postInquiryRoute(inqReq);
    expect(inqRes.status).toBe(400);
    expect(db.inquiry.create).not.toHaveBeenCalled();

    vi.mocked(db.project.findFirst).mockResolvedValueOnce(pendingProviderProject as any);
    const waReq = new NextRequest("http://localhost:3000/api/projects/project-alpha/whatsapp", {
      headers: { "x-forwarded-for": "10.0.0.11" },
    });
    const waRes = await getWhatsAppRoute(waReq, {
      params: Promise.resolve({ slug: "project-alpha" }),
    });
    expect(waRes.status).toBe(403);
  });

  // Critical Test 10: Provider with showEmail: false rejects email inquiries with 403
  it("Rejects email inquiry when provider has showEmail: false", async () => {
    const noEmailProject = {
      ...projectA,
      provider: {
        ...providerA,
        showEmail: false,
      },
    };

    vi.mocked(db.project.findFirst).mockResolvedValueOnce(noEmailProject as any);

    const inqReq = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "10.0.0.12",
      },
      body: JSON.stringify({
        projectId: projectA.id,
        name: "Test Customer",
        email: "customer@test.com",
        message: "Attempting to send email inquiry when showEmail is false.",
      }),
    });

    const inqRes = await postInquiryRoute(inqReq);
    expect(inqRes.status).toBe(403);
    expect(db.inquiry.create).not.toHaveBeenCalled();
  });
});
