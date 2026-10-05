// components/receipts/PrintButton.tsx
"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl bg-[#155761] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0f434b] cursor-pointer"
    >
      <Printer className="w-4 h-4" />
      Download / Print PDF
    </button>
  );
}
