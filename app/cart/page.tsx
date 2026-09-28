// app/cart/page.tsx
// Shopping Cart and Saved Projects page for Soft Showcase.

import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartPageContent } from "@/components/cart/CartPageContent";
import { APP_NAME } from "@/config/constants";

export const metadata: Metadata = {
  title: `Saved Projects & Cart — ${APP_NAME}`,
  description: "Review your shortlisted software projects, estimate costs, and connect directly with creators.",
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
