// app/not-found.tsx
// Global 404 page — shown when no route matches.

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-gray-200">404</p>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          Page not found
        </h1>
        <p className="mt-2 text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go back home
        </Link>
      </div>
    </main>
  );
}
