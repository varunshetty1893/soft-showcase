// app/cart/page.tsx
// Shopping Cart and Saved Projects page for Soft Showcase.

import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartPageContent } from "@/components/cart/CartPageContent";
import { APP_NAME, APP_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: "Saved Projects & Cart — Soft Showcase",
  description:
    "Review your shortlisted software solutions, calculate project investments, and connect directly with creators.",
  alternates: {
    canonical: `${APP_URL}/cart`,
  },
  openGraph: {
    title: `Saved Projects & Cart — ${APP_NAME}`,
    description:
      "Review your shortlisted software solutions, calculate project investments, and connect directly with creators.",
    url: `${APP_URL}/cart`,
    siteName: APP_NAME,
    type: "website",
    images: [
      {
        url: `${APP_URL}/logo.png`,
        width: 800,
        height: 600,
        alt: `${APP_NAME} Cart`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Saved Projects & Cart — ${APP_NAME}`,
    description:
      "Review your shortlisted software solutions, calculate project investments, and connect directly with creators.",
    images: [`${APP_URL}/logo.png`],
  },
};

export default function CartPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFA]">
      <Navbar />
      <main className="flex-1">
        <CartPageContent />
      </main>
      <Footer />
    </div>
  );
}
