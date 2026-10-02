// tests/unit/project-permissions.test.ts
// Unit tests for Phase 3 — Admin cannot edit partner-owned project content:
// - Ownership derivation (partner-owned when provider is linked to a user with role === "solution_partner")
// - Whitelist accept / reject table for partner-owned projects
// - Bulk and import paths respect the policy
// - Admin-managed projects remain fully editable
// - Partner cannot override an active admin moderation hold

import { describe, it, expect } from "vitest";
import {
  ADMIN_EDITABLE_FIELDS_PARTNER_OWNED,
  getProjectOwnership,
  isPartnerOwnedProject,
  assertAdminCanUpdate,
  assertAdminCanBulkUpdate,
  hasAdminModerationHold,
  assertPartnerCanChangeStatus,
  ProjectOwnershipError,
} from "@/lib/auth/project-permissions";

describe("Phase 3 — Project Ownership & Admin Edit Boundaries", () => {
  const partnerOwnedProject = {
    id: "proj-partner-1",
    title: "Partner AI CRM",
    status: "PUBLISHED",
    providerId: "prov-partner-1",
    provider: {
      id: "prov-partner-1",
      userId: "user-partner-1",
      user: {
        id: "user-partner-1",
        role: "solution_partner",
        isAdmin: false,
      },
    },
  };

  const adminManagedProject = {
    id: "proj-admin-1",
    title: "Platform Core Starter",
    status: "PUBLISHED",
    providerId: "prov-admin-1",
    provider: {
      id: "prov-admin-1",
      userId: "user-admin-1",
      user: {
        id: "user-admin-1",
        role: "admin",
        isAdmin: true,
      },
    },
  };

  const unlinkedImportedProject = {
    id: "proj-imported-1",
    title: "Imported Catalog Solution",
    status: "DRAFT",
    providerId: "prov-system",
    provider: {
      id: "prov-system",
      userId: null,
      user: null,
    },
  };

  describe("Ownership Derivation", () => {
    it("identifies a project as partner_owned when its provider is linked to a solution_partner user", () => {
      expect(getProjectOwnership(partnerOwnedProject, "user-admin-1")).toBe(
        "partner_owned"
      );
      expect(isPartnerOwnedProject(partnerOwnedProject, "user-admin-1")).toBe(
        true
      );
    });

    it("identifies admin-created, imported, and admin's own provider projects as admin_managed", () => {
      expect(getProjectOwnership(adminManagedProject, "user-admin-1")).toBe(
        "admin_managed"
      );
      expect(isPartnerOwnedProject(adminManagedProject, "user-admin-1")).toBe(
        false
      );

      expect(getProjectOwnership(unlinkedImportedProject, "user-admin-1")).toBe(
        "admin_managed"
      );

      // Even if user role says solution_partner, if it belongs to the acting admin's own userId it is admin-managed
      expect(getProjectOwnership(partnerOwnedProject, "user-partner-1")).toBe(
        "admin_managed"
      );
    });
  });

  describe("Whitelist Accept / Reject Table on Partner-Owned Projects", () => {
    it("allows every whitelisted moderation field on partner-owned projects", () => {
      const allowedPatches: Array<Record<string, unknown>> = [
        { featured: true },
        { isFeatured: false },
        { featuredOrder: 2 },
        { displayOrder: 5 },
        { categoryId: "cat-ai-ml" },
        { status: "PUBLISHED" },
        { status: "ARCHIVED" },
        {
          status: "DRAFT",
          moderationNote: "Please add live demo video before republishing.",
        },
        {
          status: "REJECTED",
          moderationNote: "Broken source repository link.",
        },
        {
          requestChanges: true,
          moderationNote: "Please clarify installation prerequisites in README.",
        },
      ];

      for (const patch of allowedPatches) {
        expect(() =>
          assertAdminCanUpdate(partnerOwnedProject, patch, "user-admin-1")
        ).not.toThrow();
      }
    });

    it("requires a moderationNote reason when unpublishing (DRAFT) or rejecting a partner-owned project", () => {
      expect(() =>
        assertAdminCanUpdate(
          partnerOwnedProject,
          { status: "DRAFT", moderationNote: "   " },
          "user-admin-1"
        )
      ).toThrowError(ProjectOwnershipError);

      expect(() =>
        assertAdminCanUpdate(
          partnerOwnedProject,
          { status: "REJECTED" },
          "user-admin-1"
        )
      ).toThrowError(ProjectOwnershipError);
    });

    it.each([
      ["title", { title: "Hijacked Title" }],
      ["shortDescription", { shortDescription: "Edited short summary" }],
      ["fullDescription", { fullDescription: "Edited full description body" }],
      ["price", { price: 1999 }],
      ["originalPrice", { originalPrice: 9999 }],
      ["priceMode", { priceMode: "FREE" }],
      ["priceQualifier", { priceQualifier: "NEGOTIABLE" }],
      ["dealType", { dealType: "LIMITED_DEAL" }],
      ["dealLabel", { dealLabel: "Flash Deal" }],
      ["dealStartsAt", { dealStartsAt: new Date().toISOString() }],
      ["dealEndsAt", { dealEndsAt: new Date().toISOString() }],
      ["technologies", { technologies: ["React", "Node.js"] }],
      ["features", { features: [{ feature: "Modified feature" }] }],
      ["demoUrl", { demoUrl: "https://example.com" }],
      ["images", { images: [{ url: "https://example.com/1.png" }] }],
      ["whatsIncluded", { whatsIncluded: ["Full source code"] }],
    ])(
      "rejects disallowed field '%s' on partner-owned project with 403 listing disallowedFields",
      (fieldName, patch) => {
        expect(ADMIN_EDITABLE_FIELDS_PARTNER_OWNED.has(fieldName)).toBe(false);

        try {
          assertAdminCanUpdate(partnerOwnedProject, patch, "user-admin-1");
          expect.fail(`Expected ProjectOwnershipError for field ${fieldName}`);
        } catch (err) {
          expect(err).toBeInstanceOf(ProjectOwnershipError);
          const ownershipErr = err as ProjectOwnershipError;
          expect(ownershipErr.status).toBe(403);
          expect(ownershipErr.disallowedFields).toContain(fieldName);
        }
      }
    );
  });

  describe("Admin-Managed Projects Remain Fully Editable", () => {
    it("allows full content, pricing, offer, and tech-stack edits on admin-managed projects", () => {
      const fullPatch = {
        title: "Updated Enterprise ERP",
        shortDescription: "New short description",
        fullDescription: "New full description with architecture details",
        priceMode: "FIXED",
        price: 14999,
        originalPrice: 24999,
        dealType: "LIMITED_DEAL",
        technologies: ["Next.js", "PostgreSQL"],
        featured: true,
        status: "PUBLISHED",
      };

      expect(() =>
        assertAdminCanUpdate(adminManagedProject, fullPatch, "user-admin-1")
      ).not.toThrow();

      expect(() =>
        assertAdminCanUpdate(unlinkedImportedProject, fullPatch, "user-admin-1")
      ).not.toThrow();
    });
  });

  describe("Bulk and Import paths respect the policy", () => {
    it("rejects bulk update when any selected project is partner-owned and patch contains content fields", () => {
      const batch = [adminManagedProject, partnerOwnedProject];

      expect(() =>
        assertAdminCanBulkUpdate(
          batch,
          { price: 4999, dealType: "FESTIVE_SALE" },
          "user-admin-1"
        )
      ).toThrowError(ProjectOwnershipError);

      // Whitelisted bulk action (e.g. featured toggle) succeeds across mixed projects
      expect(() =>
        assertAdminCanBulkUpdate(batch, { featured: true }, "user-admin-1")
      ).not.toThrow();
    });
  });

  describe("Partner cannot override a moderation hold", () => {
    it("blocks partner from flipping status to PUBLISHED while under an admin moderation hold", () => {
      const heldProject = {
        ...partnerOwnedProject,
        status: "DRAFT",
        moderationNote: "Missing documentation and broken demo URL.",
        moderatedAt: new Date("2026-05-01T10:00:00Z"),
        moderatedById: "user-admin-1",
      };

      expect(hasAdminModerationHold(heldProject)).toBe(true);

      // Partner can still save content while keeping status as DRAFT
      expect(() =>
        assertPartnerCanChangeStatus(heldProject, "DRAFT")
      ).not.toThrow();

      // Partner cannot flip status to PUBLISHED until admin lifts hold
      expect(() =>
        assertPartnerCanChangeStatus(heldProject, "PUBLISHED")
      ).toThrowError(ProjectOwnershipError);
    });
  });
});
