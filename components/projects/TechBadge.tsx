// components/projects/TechBadge.tsx
import * as React from "react";
import { Badge } from "@/components/ui/badge";

interface TechBadgeProps {
  name: string;
}

export function TechBadge({ name }: TechBadgeProps) {
  return (
    <Badge variant="tech" className="text-[11px] px-2 py-0.5 font-mono">
      {name}
    </Badge>
  );
}
