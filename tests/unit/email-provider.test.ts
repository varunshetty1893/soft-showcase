import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createEmailProvider, GmailSmtpProvider } from "@/lib/email/providers/email-provider";
import { renderPasswordResetEmail } from "@/lib/email/templates/password-reset";
import { renderVerificationOtpEmail } from "@/lib/email/templates/verification-otp";
import { renderProviderInquiryEmail } from "@/lib/email/templates/provider-inquiry";
import { renderCustomerConfirmationEmail } from "@/lib/email/templates/customer-confirmation";
import { renderAdminCustomRequestEmail } from "@/lib/email/templates/admin-notification";
import { renderCustomerCustomRequestConfirmationEmail } from "@/lib/email/templates/custom-request-customer";
import { renderAccountExistsEmail } from "@/lib/email/templates/account-exists";

describe("Gmail SMTP Provider", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should create a GmailSmtpProvider instance via factory by default", () => {
    delete process.env.EMAIL_PROVIDER;
    const provider = createEmailProvider();
    expect(provider).toBeInstanceOf(GmailSmtpProvider);
  });

  it("should create a GmailSmtpProvider when EMAIL_PROVIDER is 'gmail'", () => {
    process.env.EMAIL_PROVIDER = "gmail";
    const provider = createEmailProvider();
    expect(provider).toBeInstanceOf(GmailSmtpProvider);
  });

  it("should fail when SMTP credentials are not configured", async () => {
    process.env.SMTP_USER = "";
    process.env.SMTP_PASSWORD = "";

    const provider = new GmailSmtpProvider();
    const result = await provider.send({
      to: "recipient@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("should fail when SMTP_PASSWORD is placeholder", async () => {
    process.env.SMTP_USER = "test@gmail.com";
    process.env.SMTP_PASSWORD = "my-google-app-password";

    const provider = new GmailSmtpProvider();
    const result = await provider.send({
      to: "recipient@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("Transactional Email HTML Escaping (N10)", () => {
  const xssPayload = "<img src=x onerror=alert(1)>";

  it("escapes <img src=x onerror=alert(1)> in password-reset email template", () => {
    const { html } = renderPasswordResetEmail({
      userName: xssPayload,
      resetCode: "123456",
      expiresInMinutes: 15,
    });

    expect(html).not.toContain("<img src=x onerror=alert(1)>");
    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("escapes HTML injection payloads across all other transactional email templates", () => {
    const otpMail = renderVerificationOtpEmail({
      userName: xssPayload,
      otp: "654321",
      verifyUrl: "https://example.com/verify",
    });
    expect(otpMail.html).not.toContain(xssPayload);
    expect(otpMail.html).toContain("&lt;img src=x onerror=alert(1)&gt;");

    const inquiryMail = renderProviderInquiryEmail({
      providerName: xssPayload,
      projectTitle: xssPayload,
      projectUrl: "https://example.com/projects/test",
      customerName: xssPayload,
      customerEmail: "test@example.com",
      message: xssPayload,
    });
    expect(inquiryMail.html).not.toContain(xssPayload);

    const confirmMail = renderCustomerConfirmationEmail({
      customerName: xssPayload,
      projectTitle: xssPayload,
      projectUrl: "https://example.com/projects/test",
      providerName: xssPayload,
    });
    expect(confirmMail.html).not.toContain(xssPayload);

    const customAdminMail = renderAdminCustomRequestEmail({
      name: xssPayload,
      email: "test@example.com",
      projectTitle: xssPayload,
      description: xssPayload,
      requiredFeatures: xssPayload,
    });
    expect(customAdminMail.html).not.toContain(xssPayload);

    const customCustMail = renderCustomerCustomRequestConfirmationEmail({
      customerName: xssPayload,
      projectTitle: xssPayload,
    });
    expect(customCustMail.html).not.toContain(xssPayload);

    const existsMail = renderAccountExistsEmail({
      userName: xssPayload,
    });
    expect(existsMail.html).not.toContain(xssPayload);
  });
});
