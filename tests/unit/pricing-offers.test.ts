// tests/unit/pricing-offers.test.ts
// Unit tests for Phase 4 — Pricing offers (Limited Deal and others):
// - Validation: offers only for FIXED, originalPrice > price, future end date required for
//   LIMITED_DEAL / LAUNCH_OFFER / FESTIVE_SALE / EARLY_BIRD, optional for CLEARANCE / CUSTOM,
//   custom label required & max 24 chars for CUSTOM
// - Effective pricing transitions: before dealStartsAt -> regular price; during offer -> selling price
//   with badge, struck-through regular price, savings amount & %; after dealEndsAt -> regular price
//   automatically with offer hidden
// - Price qualifiers: STARTING_FROM ("Starting from ₹X") and NEGOTIABLE ("Price negotiable")
// - Legacy permanent reference price (dealType = NONE with originalPrice > price) continues working
// - No fake urgency: countdownText is null when dealEndsAt is omitted

import { describe, it, expect } from "vitest";
import {
  getEffectivePricing,
  validatePricingOfferInput,
  toIstDatetimeLocal,
  fromIstDatetimeLocal,
} from "@/lib/utils/pricing";
import { ProjectSchema } from "@/lib/validation/project.schema";

describe("Phase 4 — Pricing Offers & Effective Pricing", () => {
  const now = new Date("2026-06-15T12:00:00.000Z");
  const past = new Date("2026-06-10T12:00:00.000Z");
  const futureStart = new Date("2026-06-16T12:00:00.000Z");
  const futureEnd = new Date("2026-06-18T16:00:00.000Z");

  const baseValidProject = {
    title: "Enterprise AI Chatbot",
    slug: "enterprise-ai-chatbot",
    shortDescription: "Production-ready RAG assistant with multi-tenant workspace.",
    fullDescription:
      "Complete enterprise AI assistant with vector search, role-based access control, and analytics dashboard.",
    status: "PUBLISHED" as const,
    featured: false,
    priceMode: "FIXED" as const,
    price: 15000,
    originalPrice: 25000,
    categoryId: "cat-ai",
    providerId: "prov-1",
  };

  describe("Validation Rules (validatePricingOfferInput & ProjectSchema)", () => {
    it("rejects offers when priceMode is not FIXED", () => {
      const errors = validatePricingOfferInput(
        {
          priceMode: "CONTACT",
          price: null,
          originalPrice: null,
          dealType: "LIMITED_DEAL",
          dealEndsAt: futureEnd,
        },
        now
      );
      expect(errors.dealType).toBeDefined();
    });

    it("requires originalPrice > price whenever an offer is set", () => {
      const errorsEqual = validatePricingOfferInput(
        {
          priceMode: "FIXED",
          price: 15000,
          originalPrice: 15000,
          dealType: "LIMITED_DEAL",
          dealEndsAt: futureEnd,
        },
        now
      );
      expect(errorsEqual.originalPrice).toBeDefined();

      const errorsMissing = validatePricingOfferInput(
        {
          priceMode: "FIXED",
          price: 15000,
          originalPrice: null,
          dealType: "CLEARANCE",
        },
        now
      );
      expect(errorsMissing.originalPrice).toBeDefined();
    });

    it.each([
      "LIMITED_DEAL",
      "LAUNCH_OFFER",
      "FESTIVE_SALE",
      "EARLY_BIRD",
    ] as const)(
      "allows offer type %s to omit dealEndsAt, but rejects a past dealEndsAt if provided",
      (dealType) => {
        // Missing end date is allowed (optional offer dates)
        const missingEnd = validatePricingOfferInput(
          {
            priceMode: "FIXED",
            price: 15000,
            originalPrice: 25000,
            dealType,
            dealEndsAt: null,
          },
          now
        );
        expect(missingEnd.dealEndsAt).toBeUndefined();

        // Past end date is rejected
        const pastEnd = validatePricingOfferInput(
          {
            priceMode: "FIXED",
            price: 15000,
            originalPrice: 25000,
            dealType,
            dealEndsAt: past,
          },
          now
        );
        expect(pastEnd.dealEndsAt).toBeDefined();

        // Valid future end date passes
        const validFuture = validatePricingOfferInput(
          {
            priceMode: "FIXED",
            price: 15000,
            originalPrice: 25000,
            dealType,
            dealEndsAt: futureEnd,
          },
          now
        );
        expect(validFuture.dealEndsAt).toBeUndefined();
      }
    );

    it("allows CLEARANCE and CUSTOM offers to omit dealEndsAt, and enforces custom dealLabel <= 24 chars", () => {
      const clearanceOk = validatePricingOfferInput(
        {
          priceMode: "FIXED",
          price: 12000,
          originalPrice: 20000,
          dealType: "CLEARANCE",
          dealEndsAt: null,
        },
        now
      );
      expect(Object.keys(clearanceOk)).toHaveLength(0);

      // CUSTOM without label fails
      const customNoLabel = validatePricingOfferInput(
        {
          priceMode: "FIXED",
          price: 12000,
          originalPrice: 20000,
          dealType: "CUSTOM",
          dealLabel: "   ",
        },
        now
      );
      expect(customNoLabel.dealLabel).toBeDefined();

      // CUSTOM with > 24 chars fails
      const customTooLong = validatePricingOfferInput(
        {
          priceMode: "FIXED",
          price: 12000,
          originalPrice: 20000,
          dealType: "CUSTOM",
          dealLabel: "This Custom Label Is Over Twenty Four Chars",
        },
        now
      );
      expect(customTooLong.dealLabel).toBeDefined();

      // CUSTOM with valid label and no end date succeeds
      const customValid = validatePricingOfferInput(
        {
          priceMode: "FIXED",
          price: 12000,
          originalPrice: 20000,
          dealType: "CUSTOM",
          dealLabel: "Monsoon Special",
          dealEndsAt: null,
        },
        now
      );
      expect(Object.keys(customValid)).toHaveLength(0);

      // Also verify Zod ProjectSchema accepts valid CUSTOM offer
      const zodRes = ProjectSchema.safeParse({
        ...baseValidProject,
        dealType: "CUSTOM",
        dealLabel: "Partner VIP Offer",
      });
      expect(zodRes.success).toBe(true);
    });
  });

  describe("getEffectivePricing(project, now) Time Transitions", () => {
    const scheduledDealProject = {
      priceMode: "FIXED",
      price: 15000,
      originalPrice: 25000,
      priceQualifier: "NONE",
      dealType: "LIMITED_DEAL",
      dealStartsAt: futureStart, // starts tomorrow
      dealEndsAt: futureEnd, // ends in 3 days
    };

    it("Before dealStartsAt -> returns regular price (originalPrice) and hides the offer", () => {
      const pricing = getEffectivePricing(scheduledDealProject, now);

      expect(pricing.offerStatus).toBe("SCHEDULED");
      expect(pricing.isOfferActive).toBe(false);
      expect(pricing.isDiscounted).toBe(false);
      expect(pricing.effectivePrice).toBe(25000);
      expect(pricing.regularPrice).toBeNull();
      expect(pricing.badgeLabel).toBeNull();
      expect(pricing.countdownText).toBeNull();
      expect(pricing.formattedPrice).toBe("₹25,000");
    });

    it("During the offer -> returns selling price with badge, struck-through regular price, savings amount/%, and real countdown", () => {
      const activeDealProject = {
        ...scheduledDealProject,
        dealStartsAt: past, // started 5 days ago
        dealEndsAt: futureEnd, // ends in 3 days 4 hours
      };

      const pricing = getEffectivePricing(activeDealProject, now);

      expect(pricing.offerStatus).toBe("ACTIVE");
      expect(pricing.isOfferActive).toBe(true);
      expect(pricing.isDiscounted).toBe(true);
      expect(pricing.effectivePrice).toBe(15000);
      expect(pricing.regularPrice).toBe(25000);
      expect(pricing.savingsAmount).toBe(10000);
      expect(pricing.discountPercent).toBe(40);
      expect(pricing.badgeLabel).toBe("Limited Deal");
      expect(pricing.formattedPrice).toBe("₹15,000");
      expect(pricing.formattedRegularPrice).toBe("₹25,000");
      expect(pricing.countdownText).toBe("Ends in 3d 4h");
    });

    it("After dealEndsAt -> automatically switches to regular price (originalPrice) and hides the expired offer", () => {
      const expiredDealProject = {
        ...scheduledDealProject,
        dealStartsAt: new Date("2026-06-01T00:00:00.000Z"),
        dealEndsAt: past, // ended 5 days ago
      };

      const pricing = getEffectivePricing(expiredDealProject, now);

      expect(pricing.offerStatus).toBe("ENDED");
      expect(pricing.isOfferActive).toBe(false);
      expect(pricing.isDiscounted).toBe(false);
      expect(pricing.effectivePrice).toBe(25000);
      expect(pricing.regularPrice).toBeNull();
      expect(pricing.badgeLabel).toBeNull();
      expect(pricing.countdownText).toBeNull();
      expect(pricing.formattedPrice).toBe("₹25,000");
    });

    it("Never shows a fake countdown when dealEndsAt is null (e.g. CLEARANCE or permanent reference price)", () => {
      const clearanceNoEnd = getEffectivePricing(
        {
          priceMode: "FIXED",
          price: 10000,
          originalPrice: 20000,
          dealType: "CLEARANCE",
          dealEndsAt: null,
        },
        now
      );

      expect(clearanceNoEnd.isOfferActive).toBe(true);
      expect(clearanceNoEnd.isDiscounted).toBe(true);
      expect(clearanceNoEnd.badgeLabel).toBe("Clearance");
      expect(clearanceNoEnd.countdownText).toBeNull();
      expect(clearanceNoEnd.dealEndsAtIso).toBeNull();

      // Existing project with permanent reference price (dealType = NONE)
      const permanentReference = getEffectivePricing(
        {
          priceMode: "FIXED",
          price: 18000,
          originalPrice: 24000,
          dealType: "NONE",
        },
        now
      );

      expect(permanentReference.isDiscounted).toBe(true);
      expect(permanentReference.isOfferActive).toBe(false);
      expect(permanentReference.effectivePrice).toBe(18000);
      expect(permanentReference.regularPrice).toBe(24000);
      expect(permanentReference.discountPercent).toBe(25);
      expect(permanentReference.countdownText).toBeNull();
    });

    it("Applies priceQualifier text ('Starting from' and 'Price negotiable') accurately", () => {
      const startingFrom = getEffectivePricing(
        {
          priceMode: "FIXED",
          price: 25000,
          priceQualifier: "STARTING_FROM",
          dealType: "NONE",
        },
        now
      );
      expect(startingFrom.qualifierText).toBe("Starting from");
      expect(startingFrom.formattedPrice).toBe("Starting from ₹25,000");

      const negotiable = getEffectivePricing(
        {
          priceMode: "FIXED",
          price: 25000,
          priceQualifier: "NEGOTIABLE",
          dealType: "NONE",
        },
        now
      );
      expect(negotiable.qualifierText).toBe("Price negotiable");
      expect(negotiable.formattedPrice).toBe("₹25,000");
    });

    it("Round-trips UTC <-> IST (Asia/Kolkata) datetime-local strings cleanly", () => {
      const utcIso = "2026-06-18T12:30:00.000Z";
      const istLocal = toIstDatetimeLocal(utcIso);
      // 12:30 UTC + 05:30 = 18:00 IST
      expect(istLocal).toBe("2026-06-18T18:00");

      const backToUtc = fromIstDatetimeLocal(istLocal);
      expect(backToUtc).toBe(utcIso);
    });
  });
});
