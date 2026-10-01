// tests/integration/inquiry-abuse.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

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
    },
  };
});

vi.mock("@/lib/email/email-service", () => {
  return {
    sendProviderInquiryEmail: vi.fn().mockResolvedValue({ success: true }),
    sendCustomerConfirmationEmail: vi.fn().mockResolvedValue({ success: true }),
  };
});

vi.mock("@/lib/auth/session", () => {
  return {
    getCurrentUser: vi.fn().mockResolvedValue(null),
  };
});

vi.mock("@/lib/utils/turnstile", () => {
  return {
    verifyTurnstileToken: vi.fn(),
  };
});

import { db } from "@/lib/db/client";
import { POST as postInquiryRoute } from "@/app/api/inquiries/route";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";

describe("Inquiry Anti-Abuse & Anti-Relay Protections (M4)", () => {
  const sampleProvider = {
    id: "provider-1",
    displayName: "Sample Provider",
    email: "provider@example.com",
    isActive: true,
    applicationStatus: "approved",
  };

  const sampleProject = {
    id: "proj-1",
    title: "Sample Project",
    slug: "sample-project",
    status: "PUBLISHED",
    providerId: sampleProvider.id,
    provider: sampleProvider,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.project.findFirst).mockResolvedValue(sampleProject as any);
    vi.mocked(verifyTurnstileToken).mockResolvedValue({ success: true });
  });

  const validPayload = {
    projectId: "proj-1",
    name: "Legit Customer",
    email: "customer@example.com",
    message: "I am interested in this production software solution.",
    contactMethod: "EMAIL",
    turnstileToken: "valid-turnstile-token",
    formSubmittedAt: Date.now() - 5000, // 5 seconds ago (passes fill-time check)
  };

  it("rejects bot submission when honeypot field is filled", async () => {
    const honeypotPayload = {
      ...validPayload,
      website: "https://spambot-link.com",
    };

    const req = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.1" },
      body: JSON.stringify(honeypotPayload),
    });

    const res = await postInquiryRoute(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid submission");
    expect(db.inquiry.create).not.toHaveBeenCalled();
  });

  it("rejects rapid bot submissions completed faster than 2 seconds", async () => {
    const rapidPayload = {
      ...validPayload,
      formSubmittedAt: Date.now() - 500, // Only 500ms elapsed
    };

    const req = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.2" },
      body: JSON.stringify(rapidPayload),
    });

    const res = await postInquiryRoute(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Form submitted too quickly");
    expect(db.inquiry.create).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated submissions when Turnstile verification fails", async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValueOnce({
      success: false,
      errorCodes: ["invalid-input-response"],
    });

    const req = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.3" },
      body: JSON.stringify({
        ...validPayload,
        turnstileToken: "invalid-token",
      }),
    });

    const res = await postInquiryRoute(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Security verification failed");
    expect(db.inquiry.create).not.toHaveBeenCalled();
  });

  it("enforces per-recipient rate limit (max 3/hour) with 429 and Retry-After", async () => {
    vi.mocked(db.inquiry.create).mockResolvedValue({ id: "inq-1" } as any);

    // Send 3 allowed inquiries to sampleProvider.email
    for (let i = 0; i < 3; i++) {
      const req = new NextRequest("http://localhost:3000/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": `10.0.1.${i}` },
        body: JSON.stringify({
          ...validPayload,
          email: `user${i}@example.com`,
        }),
      });
      const res = await postInquiryRoute(req);
      expect(res.status).toBe(201);
    }

    // 4th inquiry to same provider email should trigger recipient rate limit
    const fourthReq = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.1.99" },
      body: JSON.stringify({
        ...validPayload,
        email: "user99@example.com",
      }),
    });

    const fourthRes = await postInquiryRoute(fourthReq);
    expect(fourthRes.status).toBe(429);
    expect(fourthRes.headers.get("Retry-After")).toBeDefined();
    const data = await fourthRes.json();
    expect(data.error).toContain("high volume of inquiries");
  });
});
