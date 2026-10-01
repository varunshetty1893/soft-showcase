// tests/unit/pricing.test.ts
// Unit tests for Pricing Honesty (Phase 1 / B1).
// Verifies no fabricated MRP, discount calculation rules, and Zod schema validations.

import { describe, it, expect } from "vitest";
import { calculateDiscountPercent, formatPrice } from "@/lib/utils/format";
import { ProjectSchema } from "@/lib/validation/project.schema";

describe("Pricing Honesty & Discount Calculation (B1)", () => {
  describe("calculateDiscountPercent", () => {
    it("returns correct rounded discount percentage when originalPrice > price", () => {
      // 49,999 down from 99,999 is ~50%
      expect(calculateDiscountPercent(49999, 99999)).toBe(50);
      // 10,000 down from 20,000 is exactly 50%
      expect(calculateDiscountPercent(10000, 20000)).toBe(50);
      // 7,500 down from 10,000 is 25%
      expect(calculateDiscountPercent(7500, 10000)).toBe(25);
      // Decimal and string inputs
      expect(calculateDiscountPercent("4000", "5000")).toBe(20);
    });

    it("returns 0 if originalPrice <= price (no negative or zero fake discounts)", () => {
      expect(calculateDiscountPercent(5000, 5000)).toBe(0);
      expect(calculateDiscountPercent(6000, 5000)).toBe(0);
      expect(calculateDiscountPercent("10000", "9000")).toBe(0);
    });

    it("returns 0 if either price or originalPrice is null, undefined, or invalid", () => {
      expect(calculateDiscountPercent(null, 5000)).toBe(0);
      expect(calculateDiscountPercent(5000, null)).toBe(0);
      expect(calculateDiscountPercent(undefined, 5000)).toBe(0);
      expect(calculateDiscountPercent(5000, undefined)).toBe(0);
      expect(calculateDiscountPercent(0, 5000)).toBe(0);
      expect(calculateDiscountPercent(-100, 5000)).toBe(0);
      expect(calculateDiscountPercent("abc", 5000)).toBe(0);
    });
  });

  describe("ProjectSchema originalPrice validation", () => {
    const baseProject = {
      title: "Production E-Commerce Engine",
      slug: "production-ecommerce-engine",
      shortDescription: "A full-featured digital commerce platform ready for high-load retail.",
      fullDescription:
        "Comprehensive architectural blueprint and production-grade codebase with modular payments, inventory, and order dispatching systems.",
      categoryId: "cat-1",
      providerId: "prov-1",
      status: "DRAFT" as const,
      featured: false,
    };

    it("accepts a FIXED price project with valid originalPrice (originalPrice > price)", () => {
      const validFixed = {
        ...baseProject,
        priceMode: "FIXED" as const,
        price: 24999,
        originalPrice: 34999,
      };

      const result = ProjectSchema.safeParse(validFixed);
      expect(result.success).toBe(true);
    });

    it("accepts a FIXED price project without originalPrice (no discount forced)", () => {
      const validWithoutOriginal = {
        ...baseProject,
        priceMode: "FIXED" as const,
        price: 24999,
        originalPrice: null,
      };

      const result = ProjectSchema.safeParse(validWithoutOriginal);
      expect(result.success).toBe(true);
    });

    it("rejects FIXED price project if originalPrice <= price", () => {
      const invalidOriginal = {
        ...baseProject,
        priceMode: "FIXED" as const,
        price: 24999,
        originalPrice: 24999, // Equal to price
      };

      const result = ProjectSchema.safeParse(invalidOriginal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("originalPrice"))).toBe(true);
      }
    });

    it("rejects FIXED price project if originalPrice is lower than price", () => {
      const invalidLowerOriginal = {
        ...baseProject,
        priceMode: "FIXED" as const,
        price: 24999,
        originalPrice: 19999,
      };

      const result = ProjectSchema.safeParse(invalidLowerOriginal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("originalPrice"))).toBe(true);
      }
    });

    it("rejects originalPrice on FREE projects", () => {
      const invalidFreeWithOriginal = {
        ...baseProject,
        priceMode: "FREE" as const,
        price: null,
        originalPrice: 14999, // Attempting fake free MRP
      };

      const result = ProjectSchema.safeParse(invalidFreeWithOriginal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("originalPrice"))).toBe(true);
      }
    });

    it("rejects originalPrice on CONTACT projects", () => {
      const invalidContactWithOriginal = {
        ...baseProject,
        priceMode: "CONTACT" as const,
        price: null,
        originalPrice: 50000,
      };

      const result = ProjectSchema.safeParse(invalidContactWithOriginal);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((i) => i.path.includes("originalPrice"))).toBe(true);
      }
    });
  });
});
