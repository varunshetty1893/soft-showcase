// components/projects/ProjectSpecs.tsx
import * as React from "react";

interface Specification {
  id: string;
  key: string;
  value: string;
}

interface ProjectSpecsProps {
  specifications: Specification[];
}

export function ProjectSpecs({ specifications }: ProjectSpecsProps) {
  if (!specifications || specifications.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Technical Specifications</h2>
      <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
        {specifications.map((spec) => (
          <div
            key={spec.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:px-5 hover:bg-gray-50/50 transition-colors text-sm"
          >
            <span className="font-semibold text-gray-900">{spec.key}</span>
            <span className="text-gray-600 font-mono text-xs sm:text-sm mt-0.5 sm:mt-0">
              {spec.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
