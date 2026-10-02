// components/projects/PriceBadge.tsx
// Renders the price of a project according to its PriceMode and active offer state (Phase 4).
// Delegates to the shared client PriceBlock component so card, sidebar, and hero prices are identical.

import { PriceBlock } from "./PriceBlock";
import type { ProjectPricingInput } from "@/lib/utils/pricing";

interface PriceBadgeProps extends ProjectPricingInput {
  priceMode: string;
  price?: { toString(): string } | number | string | null;
  originalPrice?: { toString(): string } | number | string | null;
  variant?: "card" | "detail";
  showTaxNotice?: boolean;
}

export function PriceBadge({
  priceMode,
  price,
  originalPrice,
  priceQualifier,
  dealType,
  dealLabel,
  dealStartsAt,
  dealEndsAt,
  variant = "card",
}: PriceBadgeProps) {
  return (
    <PriceBlock
      priceMode={priceMode}
      price={price != null ? String(price) : null}
      originalPrice={originalPrice != null ? String(originalPrice) : null}
      priceQualifier={priceQualifier}
      dealType={dealType}
      dealLabel={dealLabel}
      dealStartsAt={dealStartsAt}
      dealEndsAt={dealEndsAt}
      variant={variant === "detail" ? "compact" : "card"}
    />
  );
}
