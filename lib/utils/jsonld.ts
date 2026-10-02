// lib/utils/jsonld.ts
// Schema.org structured data generators for SoftwareApplication and Breadcrumbs.
// Follows strict B6 pricing rules for Google Rich Snippets.

import { APP_NAME, APP_URL, DEFAULT_CURRENCY } from "@/config/constants";
import { getEffectivePricing, type ProjectPricingInput } from "@/lib/utils/pricing";

export interface ProjectJsonLdInput extends ProjectPricingInput {
  title: string;
  slug: string;
  shortDescription: string;
  priceMode: string;
  price?: { toString(): string } | number | string | null;
  status: string;
  category?: { name: string; slug?: string } | null;
  provider?: { displayName: string } | null;
  imageUrl?: string | null;
}

export function buildProjectOffers(
  project: Pick<
    ProjectJsonLdInput,
    | "priceMode"
    | "price"
    | "originalPrice"
    | "priceQualifier"
    | "dealType"
    | "dealLabel"
    | "dealStartsAt"
    | "dealEndsAt"
    | "status"
  >,
  now: Date = new Date()
) {
  const isPublished = project.status === "PUBLISHED";
  const availability = isPublished
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  const effective = getEffectivePricing(
    {
      priceMode: project.priceMode,
      price: project.price != null ? String(project.price) : null,
      originalPrice: project.originalPrice != null ? String(project.originalPrice) : null,
      priceQualifier: project.priceQualifier,
      dealType: project.dealType,
      dealLabel: project.dealLabel,
      dealStartsAt: project.dealStartsAt,
      dealEndsAt: project.dealEndsAt,
    },
    now
  );

  if (
    project.priceMode === "FIXED" &&
    effective.effectivePrice !== null &&
    effective.effectivePrice > 0
  ) {
    return {
      "@type": "Offer",
      price: effective.effectivePrice.toString(),
      priceCurrency: DEFAULT_CURRENCY,
      availability,
      ...(effective.isOfferActive && effective.dealEndsAtIso
        ? { priceValidUntil: effective.dealEndsAtIso }
        : {}),
    };
  }

  if (project.priceMode === "FREE") {
    return {
      "@type": "Offer",
      price: "0",
      priceCurrency: DEFAULT_CURRENCY,
      availability,
    };
  }

  // CONTACT or STARTING_FROM without fixed price: omit offers per B6
  return undefined;
}

export function buildSoftwareJsonLd(project: ProjectJsonLdInput) {
  const baseUrl = APP_URL.replace(/\/$/, "");
  const offers = buildProjectOffers(project);

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.title,
    description: project.shortDescription,
    applicationCategory: project.category?.name || "WebApplication",
    operatingSystem: "Web",
    image: project.imageUrl || undefined,
    url: `${baseUrl}/projects/${project.slug}`,
    ...(offers ? { offers } : {}),
    author: {
      "@type": "Organization",
      name: project.provider?.displayName || APP_NAME,
    },
  };
}
