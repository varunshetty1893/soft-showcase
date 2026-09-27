// components/projects/PriceBadge.tsx
import * as React from "react";
import { formatPrice } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";

interface PriceBadgeProps {
  priceMode: string;
  price?: { toString(): string } | number | string | null;
}

export function PriceBadge({ priceMode, price }: PriceBadgeProps) {
  if (priceMode === "FREE") {
    return (
      <Badge variant="success" className="font-semibold">
        Free
      </Badge>
    );
  }

  if (priceMode === "FIXED" && price) {
    return (
      <Badge variant="default" className="font-semibold">
        {formatPrice(price.toString())}
      </Badge>
    );
  }

  if (priceMode === "NEGOTIABLE") {
    return (
      <Badge variant="warning" className="font-medium">
        Negotiable
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="font-medium">
      Contact for Price
    </Badge>
  );
}
