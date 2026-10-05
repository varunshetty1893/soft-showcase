import { describe, it, expect } from "vitest";
import { InquirySchema } from "@/lib/validation/inquiry.schema";
import { CustomRequestSchema } from "@/lib/validation/custom-request.schema";
import { ProjectSchema } from "@/lib/validation/project.schema";
import { ProviderSchema } from "@/lib/validation/provider.schema";
import { ProjectImportSchema } from "@/lib/validation/project-import.schema";

describe("Validation Unit Tests", () => {
  describe("InquirySchema", () => {
    const validInquiry = {
      projectId: "proj-123",
      name: "Alice Smith",
      email: "alice@example.com",
      message: "I am very interested in this software project. Can we discuss?",
      contactMethod: "EMAIL",
    };

    it("should accept valid inquiry input", () => {
      const result = InquirySchema.safeParse(validInquiry);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Alice Smith");
        expect(result.data.email).toBe("alice@example.com");
      }
    });

    it("should enforce .strict() and reject client-injected provider_email or providerId", () => {
      const maliciousPayload = {
        ...validInquiry,
        provider_email: "attacker@victim.com",
        providerId: "attacker-provider-id",
      };

      const result = InquirySchema.safeParse(maliciousPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorKeys = result.error.errors.map((e) => e.message);
        expect(errorKeys.some((m) => m.toLowerCase().includes("unrecognized"))).toBe(true);
      }
    });

    it("should reject invalid email format", () => {
      const result = InquirySchema.safeParse({
        ...validInquiry,
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });

    it("should reject names shorter than 2 characters", () => {
      const result = InquirySchema.safeParse({
        ...validInquiry,
        name: "A",
      });
      expect(result.success).toBe(false);
    });

    it("should reject message shorter than 10 characters", () => {
      const result = InquirySchema.safeParse({
        ...validInquiry,
        message: "Too short",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("CustomRequestSchema", () => {
    const validCustomRequest = {
      name: "Bob Builder",
      email: "bob@builder.com",
      projectTitle: "AI Powered Invoice Extractor",
      category: "Artificial Intelligence",
      technologyPreferences: ["Next.js", "Python", "OpenAI"],
      description: "We require a specialized SaaS platform to extract and categorize invoices automatically from scanned PDF documents.",
      requiredFeatures: "Multi-tenant auth, OCR pipeline, Webhook notifications, Stripe billing integration",
      budget: "10000",
      deadline: "Within 2 months",
    };

    it("should accept valid custom project request", () => {
      const result = CustomRequestSchema.safeParse(validCustomRequest);
      expect(result.success).toBe(true);
    });

    it("should enforce .strict() and reject unknown properties", () => {
      const injectedPayload = {
        ...validCustomRequest,
        injectedRole: "SUPERADMIN",
      };
      const result = CustomRequestSchema.safeParse(injectedPayload);
      expect(result.success).toBe(false);
    });

    it("should reject description under 50 characters", () => {
      const result = CustomRequestSchema.safeParse({
        ...validCustomRequest,
        description: "Too short description for custom request.",
      });
      expect(result.success).toBe(false);
    });

    it("should reject requiredFeatures under 10 characters", () => {
      const result = CustomRequestSchema.safeParse({
        ...validCustomRequest,
        requiredFeatures: "Few",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ProjectSchema — Publication Gate & Pricing Rules", () => {
    const baseProject = {
      title: "Enterprise Inventory Hub",
      slug: "enterprise-inventory-hub",
      shortDescription: "A full-featured inventory and warehouse management system.",
      fullDescription: "A full-featured inventory and warehouse management system designed for mid-sized manufacturers and distributors.",
      status: "DRAFT" as const,
      featured: false,
      priceMode: "CONTACT" as const,
      price: null,
      categoryId: "cat-1",
      providerId: "prov-1",
      whatsIncluded: ["Full source code", "Deployment guide"],
    };

    it("should accept valid CONTACT project with null price", () => {
      const result = ProjectSchema.safeParse(baseProject);
      expect(result.success).toBe(true);
    });

    it("should reject CONTACT or FREE project if price is specified", () => {
      const contactWithPrice = {
        ...baseProject,
        priceMode: "CONTACT" as const,
        price: 500,
      };
      const result = ProjectSchema.safeParse(contactWithPrice);
      expect(result.success).toBe(false);
    });

    it("should require a positive price for FIXED and STARTING_FROM price modes", () => {
      const fixedWithoutPrice = {
        ...baseProject,
        priceMode: "FIXED" as const,
        price: null,
      };
      expect(ProjectSchema.safeParse(fixedWithoutPrice).success).toBe(false);

      const fixedWithZeroPrice = {
        ...baseProject,
        priceMode: "FIXED" as const,
        price: 0,
      };
      expect(ProjectSchema.safeParse(fixedWithZeroPrice).success).toBe(false);

      const fixedWithValidPrice = {
        ...baseProject,
        priceMode: "FIXED" as const,
        price: 1999,
      };
      expect(ProjectSchema.safeParse(fixedWithValidPrice).success).toBe(true);
    });

    it("should reject invalid slug formats", () => {
      const invalidSlug = {
        ...baseProject,
        slug: "Invalid Slug With Spaces and UPPERCASE",
      };
      expect(ProjectSchema.safeParse(invalidSlug).success).toBe(false);
    });
  });

  describe("ProviderSchema", () => {
    const validProvider = {
      displayName: "Varun Sharma",
      email: "varun.sharma@example.com",
      whatsappNumber: "+919876543210",
      bio: "Full stack engineer building micro-SaaS and tools.",
      isActive: true,
      showEmail: true,
      showWhatsapp: true,
      providerConsentConfirmed: true,
    };

    it("should accept valid provider details", () => {
      const result = ProviderSchema.safeParse(validProvider);
      expect(result.success).toBe(true);
    });

    it("should reject invalid provider email", () => {
      const result = ProviderSchema.safeParse({
        ...validProvider,
        email: "not-an-email",
      });
      expect(result.success).toBe(false);
    });

    it("should provide expected defaults", () => {
      const minimalProvider = {
        displayName: "Rahul Gupta",
        email: "rahul@example.com",
      };
      const result = ProviderSchema.safeParse(minimalProvider);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
        expect(result.data.showEmail).toBe(false);
        expect(result.data.showWhatsapp).toBe(true);
        expect(result.data.providerConsentConfirmed).toBe(false);
      }
    });
  });

  describe("ProjectImportSchema", () => {
    const validImport = {
      title: "AI Healthcare Diagnostics Portal",
      shortDescription: "Modern diagnostic assistance portal for independent clinics.",
      fullDescription: "An AI-powered diagnostic and patient triage portal built with Next.js, FastAPI and PyTorch.",
      category: "HealthTech",
      technologies: ["Next.js", "Python", "FastAPI"],
      provider: {
        name: "DevStudio India",
        email: "devs@devstudio.in",
        whatsapp: "+919876543211",
      },
      features: [
        "Automated lab report OCR parser",
        "Secure patient history portal",
      ],
      specifications: [
        { key: "Database", value: "PostgreSQL" },
        { key: "Hosting", value: "AWS" },
      ],
      faqs: [
        {
          question: "Can this be self-hosted?",
          answer: "Yes, standard Docker compose files are provided.",
        },
      ],
    };

    it("should validate a complete AI-generated project import payload", () => {
      const result = ProjectImportSchema.safeParse(validImport);
      expect(result.success).toBe(true);
    });

    it("should reject imports missing required provider email", () => {
      const invalidImport = {
        ...validImport,
        provider: {
          name: "DevStudio",
          email: "invalid-email-format",
        },
      };
      expect(ProjectImportSchema.safeParse(invalidImport).success).toBe(false);
    });
  });
});
