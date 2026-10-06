"use client";
// components/admin/UserManagementTable.tsx
// Full admin user management table:
// - Search (name / email / whatsapp), role filter, pagination
// - Per-row actions: Set Role, Grant/Revoke Admin, Revoke Sessions, Delete Account
// - Stats chips: inquiries, requests, tickets, transactions
// - Confirmation modals with reason input for destructive actions

import React, { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Shield,
  ShieldOff,
  LogOut,
  Trash2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  AlertTriangle,
  Loader2,
  X,
  RefreshCw,
  MessageSquare,
  Ticket,
  FileQuestion,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserRow {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  isAdmin: boolean;
  whatsapp: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    inquiries: number;
    customProjectRequests: number;
    supportTickets: number;
    transactions: number;
    sessions: number;
  };
  partnerProfile: {
    id: string;
    displayName: string;
    applicationStatus: string;
    isActive: boolean;
    removedAt: string | null;
  } | null;
}

interface Props {
  initialUsers: UserRow[];
  initialTotal: number;
  currentAdminId: string;
  initialSearch?: string;
  initialRole?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function RoleBadge({ user }: { user: UserRow }) {
  if (user.isAdmin) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 text-[10px] font-bold uppercase tracking-wide">
        <Shield className="w-2.5 h-2.5" /> Admin
      </span>
    );
  }
  if (user.role === "solution_partner") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F3F7F7] text-[#155761] border border-[#BEDEE1] text-[10px] font-bold uppercase tracking-wide">
        <UserCheck className="w-2.5 h-2.5" /> Partner
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200 text-[10px] font-bold uppercase tracking-wide">
      <Users className="w-2.5 h-2.5" /> Customer
    </span>
  );
}

function Avatar({ user }: { user: UserRow }) {
  const initials = (user.name || user.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    "bg-[#155761] text-white",
    "bg-violet-600 text-white",
    "bg-amber-500 text-white",
    "bg-rose-500 text-white",
    "bg-emerald-600 text-white",
  ];
  const color = colors[user.email.charCodeAt(0) % colors.length];

  if (user.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.image}
        alt={user.name || user.email}
        className="w-8 h-8 rounded-full object-cover border border-[#D9E2E4] shrink-0"
      />
    );
  }
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${color}`}>
      {initials}
    </div>
  );
}

function StatChip({ icon: Icon, count, label, color }: { icon: any; count: number; label: string; color: string }) {
  if (count === 0) return null;
  return (
    <span
      title={`${count} ${label}`}
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${color}`}
    >
      <Icon className="w-2.5 h-2.5" />
      {count}
    </span>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel: string;
  confirmClass?: string;
  requireReason?: boolean;
  requireTypeName?: string;
  isDestructive?: boolean;
  loading: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}

function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmClass = "bg-[#155761] hover:bg-[#0E3E45] text-white",
  requireReason,
  requireTypeName,
  isDestructive,
  loading,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const nameMatch = !requireTypeName || typed.trim() === requireTypeName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#D9E2E4] max-w-md w-full p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            {isDestructive && (
              <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
            )}
            <h3 className="text-sm font-bold text-[#102124]">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-[#F3F7F7] flex items-center justify-center cursor-pointer transition"
          >
            <X className="w-4 h-4 text-[#526267]" />
          </button>
        </div>

        <p className="text-xs text-[#526267] leading-relaxed">{description}</p>

        {requireReason && (
          <div>
            <label className="text-xs font-semibold text-[#102124]">
              Reason {isDestructive ? "*" : "(optional)"}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Briefly explain this action…"
              className="mt-1 w-full text-xs rounded-xl border border-[#D9E2E4] px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#155761]"
            />
          </div>
        )}

        {requireTypeName && (
          <div>
            <label className="text-xs font-semibold text-[#102124]">
              Type <span className="font-mono text-rose-700">{requireTypeName}</span> to confirm
            </label>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className="mt-1 w-full text-xs rounded-xl border border-[#D9E2E4] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#D9E2E4] text-[#526267] hover:bg-[#F3F7F7] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || !nameMatch || (isDestructive && requireReason && !reason.trim())}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${confirmClass}`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Table Component ───────────────────────────────────────────────────────

type ModalState =
  | { type: "set_role"; user: UserRow }
  | { type: "make_admin"; user: UserRow }
  | { type: "remove_admin"; user: UserRow }
  | { type: "revoke_sessions"; user: UserRow }
  | { type: "delete_account"; user: UserRow }
  | null;

export function UserManagementTable({
  initialUsers,
  initialTotal,
  currentAdminId,
  initialSearch = "",
  initialRole = "all",
}: Props) {
  const toast = useToast();

  // ── State ──────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<UserRow[]>(initialUsers);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState(initialRole);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    if (initialRole !== undefined) {
      setRoleFilter(initialRole);
    }
  }, [initialRole]);

  const [fetching, setFetching] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [newRole, setNewRole] = useState("customer");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number; openUpwards: boolean } | null>(null);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch users ────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(
    async (opts: { q?: string; role?: string; page?: number; pageSize?: number }) => {
      setFetching(true);
      try {
        const sp = new URLSearchParams();
        const currentQ = opts.q !== undefined ? opts.q : search;
        const currentRole = opts.role !== undefined ? opts.role : roleFilter;
        const currentPage = opts.page ?? page;
        const currentPageSize = opts.pageSize ?? pageSize;

        if (currentQ) sp.set("q", currentQ);
        if (currentRole && currentRole !== "all") sp.set("role", currentRole);
        sp.set("page", String(currentPage));
        sp.set("pageSize", String(currentPageSize));

        const res = await fetch(`/api/admin/users?${sp.toString()}`);
        const data = await res.json();
        if (res.ok) {
          setUsers(data.users);
          setTotal(data.total);
          setPage(data.currentPage);
          if (data.pageSize) setPageSize(data.pageSize);
        } else {
          toast.error(data.error ?? "Failed to load users");
        }
      } finally {
        setFetching(false);
      }
    },
    [search, roleFilter, page, pageSize, toast]
  );

  // Debounced search
  const handleSearch = (q: string) => {
    setSearch(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchUsers({ q, role: roleFilter, page: 1 });
    }, 350);
  };

  const handleRoleFilter = (r: string) => {
    setRoleFilter(r);
    fetchUsers({ q: search, role: r, page: 1 });
  };

  const handlePage = (p: number) => {
    fetchUsers({ page: p });
  };

  const handlePageSize = (size: number) => {
    setPageSize(size);
    fetchUsers({ page: 1, pageSize: size });
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const doAction = async (
    userId: string,
    body: Record<string, unknown>
  ): Promise<boolean> => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Action failed");
        return false;
      }
      return true;
    } catch {
      toast.error("Network error");
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const updateUserLocally = (id: string, patch: Partial<UserRow>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  };

  const handleConfirm = async (reason: string) => {
    if (!modal) return;
    const { user } = modal;

    switch (modal.type) {
      case "set_role": {
        const ok = await doAction(user.id, { action: "set_role", role: newRole, reason });
        if (ok) {
          updateUserLocally(user.id, {
            role: newRole,
            isAdmin: newRole === "admin",
            partnerProfile: newRole === "solution_partner" ? user.partnerProfile : null,
          });
          toast.success(`Role updated to "${newRole}".`);
        }
        break;
      }
      case "make_admin": {
        const ok = await doAction(user.id, { action: "make_admin", reason });
        if (ok) {
          updateUserLocally(user.id, { role: "admin", isAdmin: true });
          toast.success(`${user.name || user.email} is now an admin.`);
        }
        break;
      }
      case "remove_admin": {
        const ok = await doAction(user.id, { action: "remove_admin", reason });
        if (ok) {
          updateUserLocally(user.id, { role: "customer", isAdmin: false, partnerProfile: null });
          toast.success("Admin privileges removed.");
        }
        break;
      }
      case "revoke_sessions": {
        const ok = await doAction(user.id, { action: "revoke_sessions", reason });
        if (ok) {
          toast.success("All active sessions revoked.");
        }
        break;
      }
      case "delete_account": {
        const ok = await doAction(user.id, { action: "delete_account", reason });
        if (ok) {
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
          setTotal((t) => t - 1);
          toast.success("Account deleted.");
        }
        break;
      }
    }
    setModal(null);
  };

  // ── Tab counts ────────────────────────────────────────────────────────────
  const tabs = [
    { label: "All Users", value: "all" },
    { label: "Customers", value: "customer" },
    { label: "Partners", value: "solution_partner" },
    { label: "Admins", value: "admin" },
  ];

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Search + Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#526267]" />
          <input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name, email, or WhatsApp…"
            className="w-full pl-9 pr-4 h-10 rounded-xl border border-[#D9E2E4] bg-white text-xs focus:outline-none focus:ring-2 focus:ring-[#155761] shadow-xs"
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-[#526267]" />
            </button>
          )}
        </div>
        <button
          onClick={() => fetchUsers({ q: search, role: roleFilter, page })}
          className="h-10 px-3 rounded-xl border border-[#D9E2E4] bg-white hover:bg-[#F3F7F7] text-[#526267] flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${fetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Role Tabs */}
      <div className="flex overflow-x-auto gap-2 no-scrollbar touch-pan-x">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleRoleFilter(tab.value)}
            className={`shrink-0 h-9 px-4 rounded-full text-xs font-semibold transition cursor-pointer border ${
              roleFilter === tab.value
                ? "bg-[#155761] text-white border-[#155761] shadow-sm"
                : "bg-white text-[#526267] border-[#D9E2E4] hover:border-[#155761]/50 hover:text-[#102124]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <p className="text-xs text-[#526267]">
        {fetching
          ? "Loading…"
          : `Showing ${users.length} of ${total} user${total !== 1 ? "s" : ""}`}
      </p>

      {/* Table Card */}
      <div className="bg-white border border-[#D9E2E4] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto [scrollbar-width:thin]">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#D9E2E4] bg-[#F8FAFA] text-[#526267] text-left text-xs uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5">User</th>
                <th className="px-4 py-3.5">Role</th>
                <th className="px-4 py-3.5">Activity</th>
                <th className="px-4 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D9E2E4]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-[#526267] text-xs">
                    {fetching ? (
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#155761]" />
                    ) : (
                      <>
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p>No users found</p>
                      </>
                    )}
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isSelf = user.id === currentAdminId;
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#F8FAFA]/60 transition-colors"
                    >
                      {/* User info */}
                      <td className="px-5 py-3 align-middle">
                        <div className="flex items-center gap-3">
                          <Avatar user={user} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-[#102124] text-xs">
                                {user.name || "—"}
                              </span>
                              {isSelf && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                                  You
                                </span>
                              )}
                              {user.role === "solution_partner" && (
                                <Link
                                  href={`/admin/providers?q=${encodeURIComponent(user.email)}`}
                                  title={
                                    user.partnerProfile
                                      ? `Partner: ${user.partnerProfile.displayName} (${user.partnerProfile.applicationStatus}) — Click to view in Partners & Providers`
                                      : `Partner Account — Click to view in Partners & Providers`
                                  }
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-[#DDF4EC] text-[#155761] border border-[#BEDEE1] font-semibold hover:bg-[#BEDEE1]/60 hover:underline transition"
                                >
                                  Partner ↗
                                </Link>
                              )}
                            </div>
                            <div className="text-[11px] text-[#526267] mt-0.5 truncate max-w-[240px]">
                              {user.email}
                            </div>
                            {user.whatsapp && (
                              <div className="text-[10px] text-[#526267]">
                                WA: {user.whatsapp}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3 align-middle whitespace-nowrap">
                        <RoleBadge user={user} />
                      </td>

                      {/* Activity */}
                      <td className="px-4 py-3 align-middle">
                        <div className="flex flex-wrap items-center gap-1">
                          <StatChip
                            icon={MessageSquare}
                            count={user._count.inquiries}
                            label="inquiries"
                            color="bg-blue-50 text-blue-700"
                          />
                          <StatChip
                            icon={FileQuestion}
                            count={user._count.customProjectRequests}
                            label="custom requests"
                            color="bg-violet-50 text-violet-700"
                          />
                          <StatChip
                            icon={Ticket}
                            count={user._count.supportTickets}
                            label="support tickets"
                            color="bg-amber-50 text-amber-700"
                          />
                          <StatChip
                            icon={Receipt}
                            count={user._count.transactions}
                            label="transactions"
                            color="bg-emerald-50 text-emerald-700"
                          />
                          {user._count.sessions > 0 && (
                            <span
                              title={`${user._count.sessions} active session(s)`}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-700"
                            >
                              {user._count.sessions} sess.
                            </span>
                          )}
                          {user._count.inquiries === 0 &&
                            user._count.customProjectRequests === 0 &&
                            user._count.supportTickets === 0 &&
                            user._count.transactions === 0 &&
                            user._count.sessions === 0 && (
                              <span className="text-[10px] text-[#526267] opacity-50">No activity</span>
                            )}
                        </div>
                      </td>

                      {/* Joined */}
                      <td suppressHydrationWarning className="px-4 py-3 align-middle text-[11px] text-[#526267] whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3 align-middle text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isSelf && (
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  if (openMenuId === user.id) {
                                    setOpenMenuId(null);
                                    setMenuAnchor(null);
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const openUpwards = window.innerHeight - rect.bottom < 240;
                                    setMenuAnchor({
                                      top: openUpwards ? rect.top - 6 : rect.bottom + 6,
                                      right: window.innerWidth - rect.right,
                                      openUpwards,
                                    });
                                    setOpenMenuId(user.id);
                                  }
                                }}
                                className="w-8 h-8 rounded-lg border border-[#D9E2E4] bg-white hover:bg-[#F3F7F7] flex items-center justify-center text-[#526267] cursor-pointer transition shadow-xs"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {openMenuId === user.id && menuAnchor && (
                                <>
                                  {/* Backdrop */}
                                  <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      setMenuAnchor(null);
                                    }}
                                  />
                                  <div
                                    style={{
                                      position: "fixed",
                                      top: menuAnchor.openUpwards ? undefined : `${menuAnchor.top}px`,
                                      bottom: menuAnchor.openUpwards ? `${window.innerHeight - menuAnchor.top}px` : undefined,
                                      right: `${menuAnchor.right}px`,
                                    }}
                                    className="z-50 w-52 bg-white border border-[#D9E2E4] rounded-xl shadow-2xl overflow-hidden animate-in fade-in duration-150"
                                  >
                                    {/* Set Role */}
                                    <button
                                      onClick={() => {
                                        setNewRole(user.role);
                                        setOpenMenuId(null);
                                        setModal({ type: "set_role", user });
                                      }}
                                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[#102124] hover:bg-[#F3F7F7] cursor-pointer transition"
                                    >
                                      <UserCheck className="w-3.5 h-3.5 text-[#155761]" />
                                      Change Role
                                    </button>

                                    {/* View in Partners & Providers */}
                                    {user.role === "solution_partner" && (
                                      <Link
                                        href={`/admin/providers?q=${encodeURIComponent(user.email)}`}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[#155761] hover:bg-[#F3F7F7] cursor-pointer transition font-medium"
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          setMenuAnchor(null);
                                        }}
                                      >
                                        <Users className="w-3.5 h-3.5 text-[#155761]" />
                                        View in Partners & Providers
                                      </Link>
                                    )}

                                    {/* Grant/Remove Admin */}
                                    {user.isAdmin ? (
                                      <button
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          setModal({ type: "remove_admin", user });
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-amber-700 hover:bg-amber-50 cursor-pointer transition"
                                      >
                                        <ShieldOff className="w-3.5 h-3.5" />
                                        Remove Admin Privileges
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          setModal({ type: "make_admin", user });
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-violet-700 hover:bg-violet-50 cursor-pointer transition"
                                      >
                                        <Shield className="w-3.5 h-3.5" />
                                        Grant Admin Privileges
                                      </button>
                                    )}

                                    {/* Revoke Sessions */}
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setModal({ type: "revoke_sessions", user });
                                      }}
                                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-[#102124] hover:bg-[#F3F7F7] cursor-pointer transition"
                                    >
                                      <LogOut className="w-3.5 h-3.5 text-[#526267]" />
                                      Revoke All Sessions
                                    </button>

                                    <div className="border-t border-[#D9E2E4]" />

                                    {/* Delete */}
                                    {!user.isAdmin && (
                                      <button
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          setModal({ type: "delete_account", user });
                                        }}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer transition"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Delete Account
                                      </button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                          {isSelf && (
                            <span className="text-[10px] text-[#526267] italic px-2">Protected</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 border-t border-[#D9E2E4] bg-[#F8FAFA]">
          <div className="flex items-center gap-3 text-xs text-[#526267]">
            <span>
              Showing{" "}
              <span className="font-semibold text-[#102124]">
                {total === 0 ? 0 : (page - 1) * pageSize + 1}
              </span>
              –
              <span className="font-semibold text-[#102124]">
                {Math.min(page * pageSize, total)}
              </span>{" "}
              of <span className="font-semibold text-[#102124]">{total}</span> users
            </span>

            <div className="flex items-center gap-1.5 ml-2 border-l border-[#D9E2E4] pl-3">
              <span className="text-[11px]">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSize(Number(e.target.value))}
                className="h-7 px-2 text-xs rounded-lg border border-[#D9E2E4] bg-white text-[#102124] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#155761]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={page <= 1 || fetching}
              onClick={() => handlePage(page - 1)}
              className="h-8 px-2.5 rounded-lg border border-[#D9E2E4] bg-white hover:bg-[#F3F7F7] text-xs font-semibold text-[#526267] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition flex items-center gap-1 shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>

            {/* Page number buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                disabled={fetching}
                onClick={() => handlePage(p)}
                className={`h-8 min-w-8 px-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center ${
                  page === p
                    ? "bg-[#155761] text-white shadow-2xs font-bold"
                    : "border border-[#D9E2E4] bg-white hover:bg-[#F3F7F7] text-[#526267]"
                }`}
              >
                {p}
              </button>
            ))}

            <button
              disabled={page >= totalPages || fetching}
              onClick={() => handlePage(page + 1)}
              className="h-8 px-2.5 rounded-lg border border-[#D9E2E4] bg-white hover:bg-[#F3F7F7] text-xs font-semibold text-[#526267] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition flex items-center gap-1 shadow-2xs"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}

      {modal?.type === "set_role" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#D9E2E4] max-w-md w-full p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#102124]">
                Change Role — {modal.user.name || modal.user.email}
              </h3>
              <button
                onClick={() => setModal(null)}
                className="w-7 h-7 rounded-lg hover:bg-[#F3F7F7] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-[#526267]" />
              </button>
            </div>

            <div className="space-y-2">
              {(["customer", "solution_partner", "admin"] as const).map((r) => (
                <label
                  key={r}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    newRole === r
                      ? "border-[#155761] bg-[#F3F7F7]"
                      : "border-[#D9E2E4] hover:border-[#155761]/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={newRole === r}
                    onChange={() => setNewRole(r)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-xs font-semibold text-[#102124] capitalize">
                      {r === "solution_partner" ? "Solution Partner" : r.charAt(0).toUpperCase() + r.slice(1)}
                    </p>
                    <p className="text-[11px] text-[#526267]">
                      {r === "customer" && "Standard user — can browse, inquire, and request projects."}
                      {r === "solution_partner" && "Partner — can list solutions and record transactions."}
                      {r === "admin" && "Full platform admin — access to all admin controls."}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-[#D9E2E4] text-[#526267] hover:bg-[#F3F7F7] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirm("")}
                disabled={actionLoading || newRole === modal.user.role}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#155761] hover:bg-[#0E3E45] text-white transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <CheckCircle2 className="w-3.5 h-3.5" />
                Apply Role
              </button>
            </div>
          </div>
        </div>
      )}

      {modal?.type === "make_admin" && (
        <ConfirmModal
          title={`Grant admin to ${modal.user.name || modal.user.email}?`}
          description="This user will gain full access to the admin panel including user management, audit logs, and all platform controls."
          confirmLabel="Grant Admin"
          confirmClass="bg-violet-600 hover:bg-violet-700 text-white"
          requireReason
          isDestructive={false}
          loading={actionLoading}
          onConfirm={handleConfirm}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "remove_admin" && (
        <ConfirmModal
          title={`Remove admin from ${modal.user.name || modal.user.email}?`}
          description="Their role will be set back to Customer and they will lose all admin access immediately."
          confirmLabel="Remove Admin"
          confirmClass="bg-amber-600 hover:bg-amber-700 text-white"
          requireReason
          isDestructive
          loading={actionLoading}
          onConfirm={handleConfirm}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "revoke_sessions" && (
        <ConfirmModal
          title={`Revoke all sessions for ${modal.user.name || modal.user.email}?`}
          description="All active login sessions will be immediately invalidated. The user will be signed out on all devices."
          confirmLabel="Revoke Sessions"
          confirmClass="bg-[#155761] hover:bg-[#0E3E45] text-white"
          requireReason={false}
          loading={actionLoading}
          onConfirm={handleConfirm}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "delete_account" && (
        <ConfirmModal
          title={`Permanently delete ${modal.user.name || modal.user.email}?`}
          description="This will permanently delete the account and all associated data. This cannot be undone. The user's inquiries, requests, and support tickets will be removed."
          confirmLabel="Delete Permanently"
          confirmClass="bg-rose-600 hover:bg-rose-700 text-white"
          requireReason
          requireTypeName={modal.user.email}
          isDestructive
          loading={actionLoading}
          onConfirm={handleConfirm}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
