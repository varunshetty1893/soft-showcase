import { describe, expect, it } from "vitest";
import { canPublishForProvider } from "@/lib/providers/publication-eligibility";

const eligibleProvider = {
  isActive: true,
  applicationStatus: "approved",
  providerConsentConfirmed: true,
  removedAt: null,
};

describe("provider publication eligibility", () => {
  it("allows only active, approved, consented providers that have not been removed", () => {
    expect(canPublishForProvider(eligibleProvider)).toBe(true);
  });

  it.each([
    { ...eligibleProvider, isActive: false },
    { ...eligibleProvider, applicationStatus: "pending" },
    { ...eligibleProvider, providerConsentConfirmed: false },
    { ...eligibleProvider, removedAt: new Date() },
    null,
  ])("rejects an ineligible provider", (provider) => {
    expect(canPublishForProvider(provider)).toBe(false);
  });
});
