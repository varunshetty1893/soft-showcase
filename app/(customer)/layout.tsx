// app/(customer)/layout.tsx
// Customer area layout — requires the user to be signed in.
// Unauthenticated users → redirect to /login

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.email) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFA]">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}

