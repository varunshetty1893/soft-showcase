// app/admin/users/page.tsx
// Admin User Management — lists all platform users with role management.

import type { Metadata } from "next";
import { Users, UserCheck, UserX, Shield } from "lucide-react";
import { getAllUsers } from "@/lib/db/queries/users";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db/client";

export const metadata: Metadata = {
  title: "User Management — Admin | Soft Showcase",
  robots: { index: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();

  const { users, total } = await getAllUsers({ pageSize: 10 });

  // Quick stat counts
  const [totalCustomers, totalPartners, totalAdmins] = await Promise.all([
    db.user.count({ where: { role: "customer", isAdmin: false } }),
    db.user.count({ where: { role: "solution_partner" } }),
    db.user.count({ where: { isAdmin: true } }),
  ]);

  const serialized = users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
    partnerProfile: u.partnerProfile
      ? {
          ...u.partnerProfile,
          removedAt: u.partnerProfile.removedAt?.toISOString() ?? null,
        }
      : null,
  }));

  return (
    <div className="space-y-8">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D9E2E4]">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#155761]" />
            <h1 className="text-2xl font-bold tracking-tight text-[#102124]">User Management</h1>
          </div>
          <p className="mt-1 text-xs text-[#526267]">
            Manage platform users — customers, partners, and admins. Change roles, revoke sessions,
            and maintain account integrity.
          </p>
        </div>
      </div>

      {/* ── Stats Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Users",
            value: total,
            icon: Users,
            color: "bg-[#F3F7F7] text-[#155761] border-[#BEDEE1]",
            iconColor: "text-[#155761]",
          },
          {
            label: "Customers",
            value: totalCustomers,
            icon: UserCheck,
            color: "bg-blue-50 text-blue-700 border-blue-200",
            iconColor: "text-blue-600",
          },
          {
            label: "Partners",
            value: totalPartners,
            icon: UserX,
            color: "bg-emerald-50 text-emerald-700 border-emerald-200",
            iconColor: "text-emerald-600",
          },
          {
            label: "Admins",
            value: totalAdmins,
            icon: Shield,
            color: "bg-violet-50 text-violet-700 border-violet-200",
            iconColor: "text-violet-600",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className={`rounded-2xl border p-4 flex items-center gap-3 shadow-xs ${stat.color}`}
            >
              <div className="w-9 h-9 rounded-xl bg-white/60 flex items-center justify-center shrink-0">
                <Icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-[11px] font-medium opacity-80">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <UserManagementTable
        initialUsers={serialized as any}
        initialTotal={total}
        currentAdminId={currentUser?.id ?? ""}
      />
    </div>
  );
}
