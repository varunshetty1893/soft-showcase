// tests/unit/jsonld.test.ts
// Unit tests for Schema.org JSON-LD generation (B6).
// Verifies proper price formatting, availability flags, and offer omission per mode.

import { describe, it, expect } from "vitest";
import { buildProjectOffers, buildSoftwareJsonLd } from "@/lib/utils/jsonld";
import { DEFAULT_CURRENCY } from "@/config/constants";

describe("Schema.org JSON-LD Structured Data (B6)", () => {
  describe("buildProjectOffers", () => {
    it("emits Offer with plain number string and InStock for PUBLISHED FIXED price project", () => {
      const offers = buildProjectOffers({
        priceMode: "FIXED",
        price: 24999,
        status: "PUBLISHED",
      });

      expect(offers).toBeDefined();
      expect(offers).toEqual({
        "@type": "Offer",
        price: "24999",
        priceCurrency: DEFAULT_CURRENCY,
        availability: "https://schema.org/InStock",
      });
    });

    it("emits Offer with OutOfStock for non-published (DRAFT) FIXED price project", () => {
      const offers = buildProjectOffers({
        priceMode: "FIXED",
        price: "15000.50",
        status: "DRAFT",
      });

      expect(offers).toBeDefined();
      expect(offers).toEqual({
        "@type": "Offer",
        price: "15000.5",
        priceCurrency: DEFAULT_CURRENCY,
        availability: "https://schema.org/OutOfStock",
      });
    });

    it("emits Offer with price '0' for FREE projects", () => {
      const offersPublished = buildProjectOffers({
        priceMode: "FREE",
        price: null,
        status: "PUBLISHED",
      });

      expect(offersPublished).toEqual({
        "@type": "Offer",
        price: "0",
        priceCurrency: DEFAULT_CURRENCY,
        availability: "https://schema.org/InStock",
      });

      const offersArchived = buildProjectOffers({
        priceMode: "FREE",
        price: null,
        status: "ARCHIVED",
      });

      expect(offersArchived).toEqual({
        "@type": "Offer",
        price: "0",
        priceCurrency: DEFAULT_CURRENCY,
        availability: "https://schema.org/OutOfStock",
      });
    });

    it("omits offers entirely for CONTACT mode", () => {
      const offers = buildProjectOffers({
        priceMode: "CONTACT",
        price: null,
        status: "PUBLISHED",
      });

      expect(offers).toBeUndefined();
    });

    it("omits offers for STARTING_FROM mode", () => {
      const offers = buildProjectOffers({
        priceMode: "STARTING_FROM",
        price: 9999,
        status: "PUBLISHED",
      });

      expect(offers).toBeUndefined();
    });

    it("omits offers if FIXED price is <= 0 or invalid", () => {
      expect(
        buildProjectOffers({
          priceMode: "FIXED",
          price: 0,
          status: "PUBLISHED",
        })
      ).toBeUndefined();

      expect(
        buildProjectOffers({
          priceMode: "FIXED",
          price: -500,
          status: "PUBLISHED",
        })
      ).toBeUndefined();

      expect(
        buildProjectOffers({
          priceMode: "FIXED",
          price: null,
          status: "PUBLISHED",
        })
      ).toBeUndefined();
    });
  });

  describe("buildSoftwareJsonLd", () => {
    it("generates full SoftwareApplication structured data object with offers", () => {
      const jsonLd = buildSoftwareJsonLd({
        title: "AI Medical Platform",
        slug: "ai-medical-platform",
        shortDescription: "Clinical summarization tool",
        priceMode: "FIXED",
        price: 49999,
        status: "PUBLISHED",
        category: { name: "HealthTech" },
        provider: { displayName: "Health AI Labs" },
        imageUrl: "https://example.com/image.jpg",
      });

      expect(jsonLd["@type"]).toBe("SoftwareApplication");
      expect(jsonLd.name).toBe("AI Medical Platform");
      expect(jsonLd.offers).toBeDefined();
      expect(jsonLd.offers?.price).toBe("49999");
      expect(jsonLd.offers?.priceCurrency).toBe(DEFAULT_CURRENCY);
      expect(jsonLd.author?.name).toBe("Health AI Labs");
    });

    it("generates full SoftwareApplication structured data without offers for CONTACT mode", () => {
      const jsonLd = buildSoftwareJsonLd({
        title: "Enterprise ERP",
        slug: "enterprise-erp",
        shortDescription: "Custom enterprise planning",
        priceMode: "CONTACT",
        price: null,
        status: "PUBLISHED",
        category: { name: "Enterprise" },
        provider: { displayName: "Apex Solutions" },
      });

      expect(jsonLd["@type"]).toBe("SoftwareApplication");
      expect(jsonLd.offers).toBeUndefined();
    });
  });
});
