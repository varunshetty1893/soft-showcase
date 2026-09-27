"use client";
// app/error.tsx
// Global error boundary — catches unhandled runtime errors.
// Must be a Client Component.

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development.
    // In production, integrate with an error monitoring service (e.g., Sentry).
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-red-100">500</p>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-gray-500">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
