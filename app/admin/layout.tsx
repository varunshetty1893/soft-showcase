// app/admin/layout.tsx
// Admin layout — enforces isAdmin: true on every admin route and renders admin navigation.

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { LogOut, ExternalLink, ShieldCheck } from "lucide-react";
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

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Top Bar ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 h-16 border-b border-gray-200 bg-white px-4 sm:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-lg font-black tracking-tight text-gray-950"
          >
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white font-extrabold text-xs shadow-xs">
              11
            </span>
            <span>Projects</span>
            <span className="ml-1.5 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold uppercase tracking-wider">
              Admin
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/" target="_blank" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-gray-600">
              <ExternalLink className="w-3.5 h-3.5" />
              View Site
            </Button>
          </Link>

          {/* User profile snippet */}
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || "Admin"}
                className="w-8 h-8 rounded-full border border-gray-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                {session.user.name?.[0]?.toUpperCase() || "A"}
              </div>
            )}
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-gray-900 flex items-center gap-1">
                <span>{session.user.name || "Administrator"}</span>
                <ShieldCheck className="w-3 h-3 text-indigo-600" />
              </div>
              <div className="text-[11px] text-gray-400 truncate max-w-[140px]">
                {session.user.email}
              </div>
            </div>

            <form action={handleSignOut}>
              <button
                type="submit"
                title="Sign Out"
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
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
