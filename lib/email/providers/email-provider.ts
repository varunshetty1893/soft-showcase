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
 * Gmail direct SMTP provider using nodemailer with resilient TLS negotiation,
 * IPv4 enforcement (prevents unroutable IPv6 drops in cloud/serverless runtimes),
 * and automatic fallback between Port 465 (SSL) and Port 587 (STARTTLS).
 * Authenticates using a Google App Password (16 characters, no spaces).
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
    // Auto-detect TLS mode if SMTP_SECURE is not explicitly set:
    // Port 465 is direct SSL/TLS (secure: true)
    // Port 587 is STARTTLS (secure: false)
    if (process.env.SMTP_SECURE !== undefined) {
      this.secure = process.env.SMTP_SECURE !== "false";
    } else {
      this.secure = this.port === 465;
    }

    this.user = (process.env.SMTP_USER || process.env.EMAIL_FROM || "").trim();
    // Strip accidental spaces from Google App Password (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
    this.pass = (process.env.SMTP_PASSWORD || "").replace(/\s+/g, "");
    this.defaultFrom = process.env.EMAIL_FROM || this.user;
    this.defaultFromName = process.env.EMAIL_FROM_NAME || "Soft Showcase";
  }

  /**
   * Helper to build a nodemailer transporter with resilient cloud options:
   * - family: 4 forces IPv4 to avoid broken IPv6 routes in cloud datacenters (Singapore / Vercel IAD1 / AWS)
   * - proper connection, socket, and greeting timeouts to prevent hangs
   */
  private createTransporter(port: number, secure: boolean) {
    const isGmail = this.host.toLowerCase().includes("gmail");

    return nodemailer.createTransport({
      host: this.host,
      port,
      secure,
      auth: {
        user: this.user,
        pass: this.pass,
      },
      // Force IPv4 to prevent "Client network socket disconnected" on platforms with unrouted IPv6
      family: 4,
      connectionTimeout: 12000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      requireTLS: !secure && port === 587,
      tls: {
        servername: isGmail ? "smtp.gmail.com" : this.host,
        rejectUnauthorized: true,
      },
    } as nodemailer.TransportOptions);
  }

  async send(message: EmailMessage): Promise<EmailResult> {
    // If SMTP credentials are not configured or are placeholder values
    if (!this.user || !this.pass || this.pass === "my-google-app-password") {
      const errorMsg = "SMTP credentials are not configured or are using placeholder values";
      console.warn(
        `[Email:GmailSmtpProvider] ${errorMsg}. Cannot deliver email to ${message.to}: "${message.subject}"`
      );
      return {
        success: false,
        error: errorMsg,
      };
    }

    const fromAddress = message.from || this.defaultFrom;
    const from = message.fromName
      ? `"${message.fromName}" <${fromAddress}>`
      : `"${this.defaultFromName}" <${fromAddress}>`;

    const mailOptions = {
      from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    };

    // Primary attempt using configured port and secure mode
    try {
      const primaryTransporter = this.createTransporter(this.port, this.secure);
      const info = await primaryTransporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (primaryError) {
      const primaryMsg = primaryError instanceof Error ? primaryError.message : String(primaryError);
      console.warn(
        `[Email:GmailSmtpProvider] Primary delivery attempt failed on port ${this.port} (secure: ${this.secure}): ${primaryMsg}`
      );

      // Check if error is socket/TLS/timeout disconnection (frequent when cloud hosts block port 465 or drop TLS)
      const isConnectionIssue =
        primaryMsg.includes("socket disconnected") ||
        primaryMsg.includes("ECONNRESET") ||
        primaryMsg.includes("ETIMEDOUT") ||
        primaryMsg.includes("ECONNREFUSED") ||
        primaryMsg.includes("greeting");

      // If primary attempt failed on port 465, attempt automatic fallback to port 587 with STARTTLS (or vice versa)
      if (isConnectionIssue) {
        const fallbackPort = this.port === 465 ? 587 : 465;
        const fallbackSecure = fallbackPort === 465;

        console.info(
          `[Email:GmailSmtpProvider] Retrying email delivery via fallback port ${fallbackPort} (secure: ${fallbackSecure})...`
        );

        try {
          const fallbackTransporter = this.createTransporter(fallbackPort, fallbackSecure);
          const info = await fallbackTransporter.sendMail(mailOptions);

          console.info(
            `[Email:GmailSmtpProvider] Email delivered successfully via fallback port ${fallbackPort}!`
          );
          return {
            success: true,
            messageId: info.messageId,
          };
        } catch (fallbackError) {
          const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
          console.error(
            `[Email:GmailSmtpProvider] Fallback delivery attempt also failed on port ${fallbackPort}: ${fallbackMsg}`
          );
        }
      }

      console.error("[Email:GmailSmtpProvider] SMTP error:", primaryMsg);
      return {
        success: false,
        error: primaryMsg,
      };
    }
  }
}

/**
 * Factory function to select provider based on EMAIL_PROVIDER env variable.
 * Default is Gmail SMTP over port 465 (with auto-fallback to port 587).
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
