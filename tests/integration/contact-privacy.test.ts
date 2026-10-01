// tests/integration/contact-privacy.test.ts
import { describe, it, expect } from "vitest";
import { getProjectBySlug } from "@/lib/db/queries/projects";

describe("Contact Privacy Protection (H4)", () => {
  it("getProjectBySlug does NOT expose provider raw email or whatsappNumber", async () => {
    const project = await getProjectBySlug("omnicart-marketplace");
    if (!project) {
      // In mock/test db omnicart-marketplace is seeded
      return;
    }

    const provider = project.provider as any;
    expect(provider.email).toBeUndefined();
    expect(provider.whatsappNumber).toBeUndefined();
    expect(typeof provider.hasEmail).toBe("boolean");
    expect(typeof provider.hasWhatsapp).toBe("boolean");
  });
});
