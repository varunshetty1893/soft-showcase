// components/projects/ProjectFAQ.tsx
"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

interface Faq {
  id: string;
  question: string;
  answer: string;
}

interface ProjectFAQProps {
  faqs: Faq[];
}

export function ProjectFAQ({ faqs }: ProjectFAQProps) {
  const [openIds, setOpenIds] = React.useState<Record<string, boolean>>({});

  if (!faqs || faqs.length === 0) return null;

  const toggle = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
      <div className="divide-y divide-gray-100">
        {faqs.map((faq) => {
          const isOpen = Boolean(openIds[faq.id]);
          return (
            <div key={faq.id} className="py-4 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() => toggle(faq.id)}
                className="w-full flex items-center justify-between text-left font-semibold text-sm text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-indigo-600" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <p className="mt-2.5 text-xs sm:text-sm text-gray-600 leading-relaxed pl-1">
                  {faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
