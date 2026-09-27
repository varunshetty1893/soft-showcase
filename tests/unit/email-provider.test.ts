import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createEmailProvider, GmailSmtpProvider } from "@/lib/email/providers/email-provider";

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

  it("should simulate sending when SMTP credentials are not configured", async () => {
    process.env.SMTP_USER = "";
    process.env.SMTP_PASSWORD = "";

    const provider = new GmailSmtpProvider();
    const result = await provider.send({
      to: "recipient@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toContain("simulated-");
  });

  it("should simulate sending when SMTP_PASSWORD is placeholder", async () => {
    process.env.SMTP_USER = "test@gmail.com";
    process.env.SMTP_PASSWORD = "my-google-app-password";

    const provider = new GmailSmtpProvider();
    const result = await provider.send({
      to: "recipient@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toContain("simulated-");
  });
});
