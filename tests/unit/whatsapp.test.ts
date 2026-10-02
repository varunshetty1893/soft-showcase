import { describe, it, expect } from "vitest";
import { generateWhatsAppUrl, normalizeWhatsAppNumber } from "@/lib/whatsapp/whatsapp";
import { normalizeToE164, isValidPhone, parsePhone } from "@/lib/utils/phone";

describe("WhatsApp & Phone Utilities", () => {
  describe("normalizeToE164 (libphonenumber-js)", () => {
    it("normalizes Indian 10-digit numbers with default IN country", () => {
      expect(normalizeToE164("98765 43210")).toBe("+919876543210");
      expect(normalizeToE164("09876543210")).toBe("+919876543210");
      expect(normalizeToE164("919876543210")).toBe("+919876543210");
    });

    it("normalizes international numbers with + or 00 prefix", () => {
      expect(normalizeToE164("+1 (650) 253-0000")).toBe("+16502530000");
      expect(normalizeToE164("0044 7911 123456")).toBe("+447911123456");
    });

    it("rejects invalid phone numbers", () => {
      expect(isValidPhone("12345")).toBe(false);
      expect(normalizeToE164("not-a-phone")).toBeNull();
      expect(parsePhone("0000000000").isValid).toBe(false);
    });
  });

  describe("normalizeWhatsAppNumber", () => {
    it("should remove non-digit characters (+, spaces, hyphens, parentheses)", () => {
      expect(normalizeWhatsAppNumber("+91 98765-43210")).toBe("919876543210");
      expect(normalizeWhatsAppNumber("+1 (555) 019-2834")).toBe("15550192834");
    });

    it("should strip leading '00' international prefix", () => {
      expect(normalizeWhatsAppNumber("00919876543210")).toBe("919876543210");
    });

    it("should handle already clean numeric strings", () => {
      expect(normalizeWhatsAppNumber("919876543210")).toBe("919876543210");
    });
  });

  describe("generateWhatsAppUrl", () => {
    it("should generate a valid wa.me link with options object", () => {
      const url = generateWhatsAppUrl({
        phoneNumber: "+91 98765 43210",
        projectTitle: "AI Resume Builder",
        projectUrl: "https://softshowcase.com/projects/ai-resume-builder",
      });

      expect(url.startsWith("https://wa.me/919876543210?text=")).toBe(true);
      expect(url).toContain(encodeURIComponent("AI Resume Builder"));
      expect(url).toContain(encodeURIComponent("https://softshowcase.com/projects/ai-resume-builder"));
    });

    it("should support positional argument syntax", () => {
      const url = generateWhatsAppUrl(
        "+919876543210",
        "E-Commerce SaaS",
        "https://softshowcase.com/projects/ecommerce-saas"
      );

      expect(url.startsWith("https://wa.me/919876543210?text=")).toBe(true);
      expect(url).toContain(encodeURIComponent("E-Commerce SaaS"));
    });

    it("should cleanly encode multiline pre-filled messages", () => {
      const url = generateWhatsAppUrl({
        phoneNumber: "919000000001",
        projectTitle: "Project Alpha",
      });

      // Decode the query param text to verify contents
      const parsedUrl = new URL(url);
      const text = parsedUrl.searchParams.get("text");

      expect(text).toContain('Hi, I\'m interested in the "Project Alpha" project');
      expect(text).toContain("Price");
      expect(text).toContain("Features included");
    });
  });
});
