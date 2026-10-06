"use client";
// app/global-error.tsx
// Global error boundary for root layout level exceptions.
// Must be a Client Component and define html and body tags.

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[GlobalError] Unhandled root error:", error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-gray-900"
        suppressHydrationWarning
      >
        <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-lg p-6 sm:p-8 text-center">
          <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h1 className="text-xl font-bold text-gray-950">Application Error</h1>
          <p className="mt-2 text-xs text-gray-600">
            {error?.message || "An unexpected error occurred while rendering the page."}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#155761] hover:bg-[#10474F] text-white text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.location.href = "/";
                }
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold shadow-xs transition active:scale-95 cursor-pointer"
            >
              Go to Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
