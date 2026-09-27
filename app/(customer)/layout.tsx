// app/(customer)/layout.tsx
// Customer area layout — requires the user to be signed in.
// Unauthenticated users → redirect to /login

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CustomerHeader } from "@/components/customer/CustomerHeader";
import { getCustomerStats } from "@/lib/db/queries/customer";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.email) {
    redirect("/login");
  }

  const stats = await getCustomerStats(session.user.id, session.user.email);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <Navbar />

      <main className="flex-1 py-8 sm:py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <CustomerHeader
            user={{
              name: session.user.name,
              email: session.user.email,
              image: session.user.image,
              isAdmin: session.user.isAdmin,
            }}
            inquiryCount={stats.inquiryCount}
            requestCount={stats.requestCount}
          />
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}
