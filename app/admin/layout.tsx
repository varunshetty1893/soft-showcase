// app/admin/layout.tsx
// Admin layout — enforces isAdmin: true on every admin route and renders admin navigation.

import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminUserMenu } from "@/components/admin/AdminUserMenu";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }

  if (!session.user.isAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#F8FAFA] text-[#102124] flex flex-col">
      {/* ── Top Bar ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 h-16 border-b border-[#D9E2E4] bg-white px-4 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-3 py-1"
          >
            <Image
              src="/logo.png"
              alt="Soft Showcase"
              width={130}
              height={27}
              className="h-7 w-auto object-contain"
              priority
            />
            <span className="px-2 py-0.5 rounded-full bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] text-[10px] font-bold uppercase tracking-wider">
              Admin
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/" target="_blank" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-[#526267] hover:text-[#155761]">
              <ExternalLink className="w-3.5 h-3.5" />
              View Site
            </Button>
          </Link>

          {/* Admin User Menu Dropdown */}
          <div className="pl-3 border-l border-[#D9E2E4]">
            <AdminUserMenu
              user={{
                id: session.user.id,
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
                isAdmin: session.user.isAdmin,
              }}
            />
          </div>
        </div>
      </header>

      {/* ── Admin Workspace ────────────────────────────────────────────── */}
      <div className="flex-1 flex">
        <AdminSidebar />
        <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl">
          {children}
        </main>
      </div>
    </div>
  );
}
