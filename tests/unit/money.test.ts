import { describe, it, expect } from "vitest";
import { parseMoney, sumMoney, formatMoney } from "@/lib/utils/money";
import { CustomRequestSchema } from "@/lib/validation/custom-request.schema";
import { ProjectSchema } from "@/lib/validation/project.schema";

describe("parseMoney (shared price rule)", () => {
  it("accepts positive amounts and up to 2 decimals", () => {
    expect(parseMoney("1")).toEqual({ ok: true, value: 1 });
    expect(parseMoney("499.50")).toEqual({ ok: true, value: 499.5 });
    expect(parseMoney(25000)).toEqual({ ok: true, value: 25000 });
    expect(parseMoney("1,25,000")).toEqual({ ok: true, value: 125000 });
  });

  it("rejects zero, negatives, empty, NaN and junk", () => {
    for (const bad of [0, "0", "0.00", -1, "-5", "", "   ", null, undefined, "abc", "1e3", NaN, Infinity, 0.5]) {
      expect(parseMoney(bad as any).ok).toBe(false);
    }
  });

  it("rejects more than 2 decimals and absurd values", () => {
    expect(parseMoney("10.999").ok).toBe(false);
    expect(parseMoney(50_000_001).ok).toBe(false);
  });

  it("sums without float drift", () => {
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
    expect(sumMoney(["1000", "2500.50", 499.5])).toBe(4000);
  });

  it("formats with and without paise", () => {
    expect(formatMoney(2500)).toContain("2,500");
    expect(formatMoney(2500.5)).toContain("2,500.50");
    expect(formatMoney(null)).toBe("—");
  });
});

const baseRequest = {
  name: "Bob Builder",
  email: "bob@builder.com",
  projectTitle: "AI Powered Invoice Extractor",
  category: "Artificial Intelligence",
  technologyPreferences: ["Next.js", "Python"],
  description: "We require a specialized SaaS platform to extract and categorize invoices automatically from scanned PDF documents.",
  requiredFeatures: "Multi-tenant auth, OCR pipeline, Webhook notifications, Stripe billing integration",
};

describe("custom request budget", () => {
  it("accepts a positive numeric budget and normalises it", () => {
    const r = CustomRequestSchema.safeParse({ ...baseRequest, budget: "25,000" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.budget).toBe("25000");
  });
  it("treats empty budget as null", () => {
    const r = CustomRequestSchema.safeParse({ ...baseRequest, budget: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.budget).toBeNull();
  });
  it("rejects zero, negative and free-text budgets", () => {
    for (const bad of ["0", "-500", "Flexible", "$1,000 - $3,000"]) {
      expect(CustomRequestSchema.safeParse({ ...baseRequest, budget: bad }).success).toBe(false);
    }
  });
});

describe("project price schema", () => {
  const project = (extra: Record<string, unknown>) => ({
    title: "Enterprise Inventory Hub",
    slug: "enterprise-inventory-hub",
    shortDescription: "A full-featured inventory and warehouse management system.",
    fullDescription: "A full-featured inventory and warehouse management system designed for mid-sized manufacturers and distributors.",
    status: "DRAFT",
    featured: false,
    priceMode: "FIXED",
    price: 4999,
    categoryId: "cat-1",
    providerId: "prov-1",
    whatsIncluded: ["Full source code", "Deployment guide"],
    ...extra,
  });
  it("accepts a valid fixed price", () => {
    expect(ProjectSchema.safeParse(project({})).success).toBe(true);
  });
  it("rejects zero / negative price and original price", () => {
    expect(ProjectSchema.safeParse(project({ price: 0 })).success).toBe(false);
    expect(ProjectSchema.safeParse(project({ price: -10 })).success).toBe(false);
    expect(ProjectSchema.safeParse(project({ originalPrice: 0 })).success).toBe(false);
    expect(ProjectSchema.safeParse(project({ originalPrice: -5 })).success).toBe(false);
  });
  it("rejects more than 2 decimals", () => {
    expect(ProjectSchema.safeParse(project({ price: 10.999 })).success).toBe(false);
  });
});
