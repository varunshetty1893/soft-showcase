// app/cart/page.tsx
// Shopping Cart and Saved Projects page for Soft Showcase.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartPageContent } from "@/components/cart/CartPageContent";
import { APP_NAME, APP_URL } from "@/config/constants";

export const metadata: Metadata = {
  title: "Saved Projects — Soft Showcase",
  description:
    "Review your shortlisted software projects and open each listing to contact its provider.",
  alternates: {
    canonical: `${APP_URL}/cart`,
  },
  openGraph: {
    title: `Saved Projects — ${APP_NAME}`,
    description:
      "Review your shortlisted software projects and open each listing to contact its provider.",
    url: `${APP_URL}/cart`,
    siteName: APP_NAME,
    type: "website",
    images: [
      {
        url: `${APP_URL}/logo.png`,
        width: 800,
        height: 600,
        alt: `${APP_NAME} Saved Projects`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `Saved Projects — ${APP_NAME}`,
    description:
      "Review your shortlisted software projects and open each listing to contact its provider.",
    images: [`${APP_URL}/logo.png`],
  },
};

export default async function CartPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/cart");
  }

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
