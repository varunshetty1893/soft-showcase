// lib/email/providers/email-provider.ts
// Abstract email provider interface and Gmail SMTP implementation.
// Source of truth: docs/18-email-architecture.md

import nodemailer from "nodemailer";

export interface EmailMessage {
  to: string;
  from?: string;
  fromName?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailResult>;
}

/**
 * Gmail direct SMTP provider using nodemailer over port 465 with SSL/TLS.
 * Authenticates using a Google App Password (not standard account password).
 */
export class GmailSmtpProvider implements EmailProvider {
  private host: string;
  private port: number;
  private secure: boolean;
  private user: string;
  private pass: string;
  private defaultFrom: string;
  private defaultFromName: string;

  constructor() {
    this.host = process.env.SMTP_HOST || "smtp.gmail.com";
    this.port = parseInt(process.env.SMTP_PORT || "465", 10);
    this.secure = process.env.SMTP_SECURE !== "false";
    this.user = process.env.SMTP_USER || process.env.EMAIL_FROM || "";
    this.pass = process.env.SMTP_PASSWORD || "";
    this.defaultFrom = process.env.EMAIL_FROM || this.user;
    this.defaultFromName = process.env.EMAIL_FROM_NAME || "Soft Showcase";
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    // If SMTP credentials are not configured or are placeholder values in local dev
    if (!this.user || !this.pass || this.pass === "my-google-app-password") {
      console.warn(
        `[Email:GmailSmtpProvider] SMTP credentials not fully configured. Simulated send to ${message.to}: "${message.subject}"`
      );
      return {
        success: true,
        messageId: `simulated-${Date.now()}`,
      };
    }

    const fromAddress = message.from || this.defaultFrom;
    const from = message.fromName
      ? `"${message.fromName}" <${fromAddress}>`
      : `"${this.defaultFromName}" <${fromAddress}>`;

    try {
      const transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.secure, // true for port 465 SSL/TLS
        auth: {
          user: this.user,
          pass: this.pass,
        },
      });

      const info = await transporter.sendMail({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error sending email via Gmail SMTP";
      console.error("[Email:GmailSmtpProvider] SMTP error:", errorMsg);
      return {
        success: false,
        error: errorMsg,
      };
    }
  }
}

/**
 * Factory function to select provider based on EMAIL_PROVIDER env variable.
 * Default is Gmail SMTP over port 465.
 */
export function createEmailProvider(): EmailProvider {
  const providerType = (process.env.EMAIL_PROVIDER || "gmail").toLowerCase();

  switch (providerType) {
    case "gmail":
    case "smtp":
      return new GmailSmtpProvider();
    default:
      console.warn(`[Email] Unknown provider "${providerType}". Falling back to Gmail SMTP.`);
      return new GmailSmtpProvider();
  }
}
