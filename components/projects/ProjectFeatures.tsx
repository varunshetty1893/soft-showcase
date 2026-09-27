// components/projects/ProjectFeatures.tsx
import * as React from "react";
import { Check } from "lucide-react";

interface Feature {
  id: string;
  feature: string;
}

interface ProjectFeaturesProps {
  features: Feature[];
}

export function ProjectFeatures({ features }: ProjectFeaturesProps) {
  if (!features || features.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs">
      <h2 className="text-xl font-bold text-[#102124] mb-6">Key Features</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#DDF4EC] text-[#2F7D78] border border-[#2F7D78]/25 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <span className="text-sm text-[#526267] leading-snug">{item.feature}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
