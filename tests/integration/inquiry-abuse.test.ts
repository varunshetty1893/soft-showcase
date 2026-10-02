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
import {
  sendProviderInquiryEmail,
  sendCustomerConfirmationEmail,
} from "@/lib/email/email-service";
import {
  providerGlobalBurstLimiter,
  dailyOutboundEmailLimiter,
} from "@/lib/utils/rate-limit";

describe("Inquiry Anti-Abuse & Three-Layer Lead Protection (M4 / N1 / N2 / N3)", () => {
  const sampleProvider = {
    id: "provider-1",
    displayName: "Sample Provider",
    email: "provider@example.com",
    showEmail: true,
    showWhatsapp: true,
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

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(db.project.findFirst).mockResolvedValue(sampleProject as any);
    vi.mocked(db.inquiry.update).mockResolvedValue({ id: "inq-1" } as any);
    vi.mocked(verifyTurnstileToken).mockResolvedValue({ success: true });
    await providerGlobalBurstLimiter.reset(sampleProvider.id);
    await dailyOutboundEmailLimiter.reset("global_daily_email");
  });

  const validPayload = {
    projectId: "proj-1",
    name: "Legit Customer",
    email: "customer@example.com",
    message: "I am interested in this production software solution.",
    contactMethod: "EMAIL",
    turnstileToken: "valid-turnstile-token",
    formSubmittedAt: Date.now() - 5000,
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
      formSubmittedAt: Date.now() - 500,
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

  it("rejects unauthenticated submissions when Turnstile verification fails (400) or is unreachable (503)", async () => {
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

    // Unreachable Turnstile returns 503
    vi.mocked(verifyTurnstileToken).mockResolvedValueOnce({
      success: false,
      errorCodes: ["network-error"],
      unreachable: true,
    });

    const req503 = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.4" },
      body: JSON.stringify(validPayload),
    });
    const res503 = await postInquiryRoute(req503);
    expect(res503.status).toBe(503);
  });

  it("N1: passes turnstileToken from request body to verifyTurnstileToken and strips anti-spam fields before Zod validation", async () => {
    (db.inquiry.create as any).mockImplementation(async (args: any) => ({
      id: "inq-turnstile-ok",
      ...args.data,
    }));

    const req = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.99" },
      body: JSON.stringify({
        ...validPayload,
        website: "",
        formSubmittedAt: Date.now() - 4000,
        turnstileToken: "widget-token-xyz-987",
      }),
    });

    const res = await postInquiryRoute(req);
    expect(res.status).toBe(201);
    expect(verifyTurnstileToken).toHaveBeenCalledWith("widget-token-xyz-987", "10.0.0.99");
  });

  it("N2: one abuser hitting 3/hr per provider+IP cannot block other legitimate visitors", async () => {
    (db.inquiry.create as any).mockImplementation(async (args: any) => ({
      id: "inq-abuser-test",
      ...args.data,
    }));

    const abuserIp = "198.51.100.77";

    // Abuser sends 3 inquiries from same IP to sampleProvider
    for (let i = 0; i < 3; i++) {
      const req = new NextRequest("http://localhost:3000/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": abuserIp },
        body: JSON.stringify({
          ...validPayload,
          email: `abuser-${i}@example.com`,
        }),
      });
      const res = await postInquiryRoute(req);
      expect(res.status).toBe(201);
    }

    // Abuser's 4th inquiry from the same IP is blocked with 429
    const fourthAbuserReq = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": abuserIp },
      body: JSON.stringify({
        ...validPayload,
        email: "abuser-4@example.com",
      }),
    });
    const fourthAbuserRes = await postInquiryRoute(fourthAbuserReq);
    expect(fourthAbuserRes.status).toBe(429);
    expect(fourthAbuserRes.headers.get("Retry-After")).toBeDefined();

    // Legitimate visitor from a different IP is NOT blocked!
    const legitReq = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.50" },
      body: JSON.stringify({
        ...validPayload,
        email: "real-buyer@company.com",
      }),
    });
    const legitRes = await postInquiryRoute(legitReq);
    expect(legitRes.status).toBe(201);
  });

  it("N2: global burst limit (40/hr) still saves the inquiry with notificationStatus=THROTTLED and skips email without rejecting customer", async () => {
    (db.inquiry.create as any).mockImplementation(async (args: any) => ({
      id: "inq-burst",
      ...args.data,
    }));

    // Exhaust the 40/hr provider global burst bucket
    for (let i = 0; i < 40; i++) {
      await providerGlobalBurstLimiter.check(sampleProvider.id);
    }

    vi.mocked(sendProviderInquiryEmail).mockClear();

    const req = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.88" },
      body: JSON.stringify({
        ...validPayload,
        email: "burst-buyer@company.com",
      }),
    });

    const res = await postInquiryRoute(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.notificationStatus).toBe("THROTTLED");
    expect(body.data.emailDispatched).toBe(false);
    expect(sendProviderInquiryEmail).not.toHaveBeenCalled();
    expect(db.inquiry.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notificationStatus: "THROTTLED",
        }),
      })
    );
  });

  it("N3: daily outbound email cap boundary saves inquiry with notificationStatus=THROTTLED and skips sending when cap is reached", async () => {
    (db.inquiry.create as any).mockImplementation(async (args: any) => ({
      id: "inq-cap",
      ...args.data,
    }));

    // Exhaust the 500/day global email cap except 1 remaining slot
    await dailyOutboundEmailLimiter.reset("global_daily_email");
    for (let i = 0; i < 500; i++) {
      await dailyOutboundEmailLimiter.check("global_daily_email");
    }

    vi.mocked(sendProviderInquiryEmail).mockClear();
    vi.mocked(sendCustomerConfirmationEmail).mockClear();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const req = new NextRequest("http://localhost:3000/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.199" },
      body: JSON.stringify({
        ...validPayload,
        email: "cap-buyer@company.com",
      }),
    });

    const res = await postInquiryRoute(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.notificationStatus).toBe("THROTTLED");
    expect(sendProviderInquiryEmail).not.toHaveBeenCalled();
    expect(sendCustomerConfirmationEmail).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("[ALERT][EmailCap]")
    );

    errorSpy.mockRestore();
  });
});
