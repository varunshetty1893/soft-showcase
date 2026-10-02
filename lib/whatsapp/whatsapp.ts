import { normalizeToWhatsAppDigits } from "@/lib/utils/phone";

// lib/whatsapp/whatsapp.ts
// WhatsApp URL generator for project contact flow.
//
// Security rule: The WhatsApp number is ALWAYS resolved server-side from
// the provider record. The client never sends a phone number — it only
// sends the project slug. The server looks up the provider and returns
// the URL. See docs/04-provider-model.md.

/**
 * Generates a WhatsApp deep link for a specific project inquiry.
 *
 * @param whatsappNumber - Provider's WhatsApp number (E.164 format without "+")
 *                         Example: "919876543210" (India +91...)
 * @param projectTitle   - Title of the project being inquired about
 * @param projectUrl     - Full URL of the project page (for the message)
 */
export interface WhatsAppOptions {
  phoneNumber?: string;
  whatsappNumber?: string;
  projectTitle: string;
  projectUrl?: string;
  projectId?: string;
}

/**
 * Generates a WhatsApp deep link for a specific project inquiry.
 * Supports both positional parameters and an options object.
 */
export function generateWhatsAppUrl(
  optionsOrNumber: string | WhatsAppOptions,
  title?: string,
  url?: string
): string {
  let number: string;
  let projectTitle: string;
  let projectUrl: string | undefined;

  if (typeof optionsOrNumber === "object" && optionsOrNumber !== null) {
    number = optionsOrNumber.phoneNumber || optionsOrNumber.whatsappNumber || "";
    projectTitle = optionsOrNumber.projectTitle;
    projectUrl = optionsOrNumber.projectUrl;
  } else {
    number = optionsOrNumber;
    projectTitle = title || "";
    projectUrl = url;
  }

  const cleanNumber = normalizeWhatsAppNumber(number);

  const messageLines = [
    `Hi, I'm interested in the "${projectTitle}" project listed on Soft Showcase.`,
    "",
    projectUrl ? `Project link: ${projectUrl}` : `Project: ${projectTitle}`,
    "",
    "I would like to know:",
    "- Price",
    "- Features included",
    "- Customization options",
    "- Delivery details",
    "",
    "Please let me know when you're available to discuss.",
    "",
    "Thank you!",
  ];

  const encodedMessage = encodeURIComponent(messageLines.join("\n"));
  return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
}

/**
 * Normalizes a WhatsApp number to E.164-like format (digits only).
 * Handles common input formats:
 *   +91 98765 43210 → 919876543210
 *   0091-9876543210 → 919876543210
 *   9876543210      → 9876543210 (no country code assumed)
 */
export function normalizeWhatsAppNumber(raw: string): string {
  if (!raw) return "";
  const parsedDigits = normalizeToWhatsAppDigits(raw);
  if (parsedDigits) return parsedDigits;
  return raw.replace(/\D/g, "").replace(/^00/, "");
}
