// lib/db/audit.ts
// Audit logging service for recording administrative and system actions.
// Source of truth: docs/32-audit-logging.md & Phase 5 Audit Logs Specification

import { db } from "@/lib/db/client";
import { Prisma } from "@prisma/client";

export interface AuditOptions {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
}

export type AuditActionCategory = "created_approved" | "updated" | "rejected_deleted" | "other";

export function getAuditActionCategory(action: string): AuditActionCategory {
  const upper = (action || "").toUpperCase();
  if (
    upper.includes("CREATE") ||
    upper.includes("APPROV") ||
    upper.includes("ACTIVAT") ||
    upper.includes("RESTORE") ||
    upper.includes("PUBLISH")
  ) {
    return "created_approved";
  }
  if (
    upper.includes("REMOVE") ||
    upper.includes("REJECT") ||
    upper.includes("DELETE") ||
    upper.includes("DENIED")
  ) {
    return "rejected_deleted";
  }
  if (upper.includes("UPDATE") || upper.includes("MODERAT") || upper.includes("EDIT")) {
    return "updated";
  }
  return "other";
}

export type AuditPageSize = 25 | 50 | 100;

export interface AuditFilterOptions {
  actions?: string[];
  entityTypes?: string[];
  distinctActions: string[];
  distinctEntityTypes: string[];
  actors: { id: string; label: string; name?: string | null; email?: string | null }[];
}

export interface AuditLogFilterState {
  q: string;
  actions: string[];
  entityTypes: string[];
  actor: string;
  from: string;
  to: string;
  sort: "newest" | "oldest";
  page: number;
  pageSize: AuditPageSize;
}

export interface RawAuditLogRow {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: unknown;
  createdAt: Date;
  searchText?: string | null;
}

export interface SerializedAuditLogRow {
  id: string;
  userId: string | null;
  action: string;
  actionCategory: AuditActionCategory;
  entityType: string;
  entityId: string | null;
  details: unknown;
  createdAtIso: string;
  actor: {
    id: string | null;
    status: "system" | "resolved" | "deleted";
    name: string | null;
    email: string | null;
    displayLabel: string;
  };
  entity: {
    entityType: string;
    entityId: string | null;
    label: string | null;
    href: string | null;
  };
}

// ── Redaction Helpers ─────────────────────────────────────────────────────────

const SENSITIVE_KEY_PATTERNS = [
  "password",
  "passwordhash",
  "token",
  "secret",
  "otp",
  "codehash",
  "authorization",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "apikey",
  "api_key",
];

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, "");
  return SENSITIVE_KEY_PATTERNS.some((pat) => normalized.includes(pat));
}

/**
 * Recursively redacts passwords, tokens, API keys, and OTPs from payloads.
 */
export function redactPayload(payload: unknown): unknown {
  if (payload === null || payload === undefined) return payload;
  if (typeof payload !== "object") return payload;

  if (Array.isArray(payload)) {
    return payload.map((item) => redactPayload(item));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (isSensitiveKey(key)) {
      result[key] = "[REDACTED]";
    } else if (value && typeof value === "object") {
      result[key] = redactPayload(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Builds searchable plaintext index from action, entity, actor, and safe details.
 * Never indexes redacted values.
 */
export function buildAuditSearchText(params: {
  action: string;
  entityType: string;
  entityId?: string | null;
  userId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  details?: unknown;
}): string {
  const tokens: string[] = [
    params.action,
    params.entityType,
    params.entityId || "",
    params.actorName || "",
    params.actorEmail || "",
  ];

  function extractTokens(val: unknown) {
    if (val === null || val === undefined) return;
    if (typeof val === "string") {
      if (val !== "[REDACTED]") tokens.push(val);
    } else if (typeof val === "number" || typeof val === "boolean") {
      tokens.push(String(val));
    } else if (Array.isArray(val)) {
      for (const item of val) extractTokens(item);
    } else if (typeof val === "object") {
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        if (!isSensitiveKey(k)) {
          tokens.push(k);
          extractTokens(v);
        }
      }
    }
  }

  if (params.details) {
    extractTokens(redactPayload(params.details));
  }

  return tokens
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

// ── IST Day Bounds ───────────────────────────────────────────────────────────

/**
 * Computes inclusive start and end of day in IST (UTC+05:30).
 * e.g. "2026-10-02" -> start 2026-10-01T18:30:00.000Z, end 2026-10-02T18:29:59.999Z.
 */
export function getIstDayBounds(
  fromStr?: string,
  toStr?: string
): { fromUtc: Date | null; toUtc: Date | null } {
  let fromUtc: Date | null = null;
  let toUtc: Date | null = null;

  const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

  if (fromStr && DATE_REGEX.test(fromStr.trim())) {
    const d = new Date(`${fromStr.trim()}T00:00:00.000+05:30`);
    if (!isNaN(d.getTime())) fromUtc = d;
  }

  if (toStr && DATE_REGEX.test(toStr.trim())) {
    const d = new Date(`${toStr.trim()}T23:59:59.999+05:30`);
    if (!isNaN(d.getTime())) toUtc = d;
  }

  return { fromUtc, toUtc };
}

// ── Parsing & Prisma Query Builder ───────────────────────────────────────────

function parseListParam(param: unknown): string[] {
  if (!param) return [];
  const rawList: string[] = Array.isArray(param)
    ? param.flatMap((p) => (typeof p === "string" ? p.split(",") : []))
    : typeof param === "string"
    ? param.split(",")
    : [];

  return rawList.map((s) => s.trim()).filter(Boolean);
}

export function parseAuditLogFilters(raw: Record<string, unknown>): AuditLogFilterState {
  const rawQ = typeof raw.q === "string" ? raw.q.trim() : "";
  const q = rawQ.slice(0, 100);

  const actions = parseListParam(raw.action || raw.actions);
  const entityTypes = parseListParam(raw.entityType || raw.entityTypes);
  const actor = typeof raw.actor === "string" ? raw.actor.trim() : "";
  const from = typeof raw.from === "string" ? raw.from.trim() : "";
  const to = typeof raw.to === "string" ? raw.to.trim() : "";
  const sort = raw.sort === "oldest" ? "oldest" : "newest";

  const rawSize = Number(raw.pageSize);
  const pageSize: AuditPageSize = rawSize === 50 || rawSize === 100 ? rawSize : 25;

  const rawPage = parseInt(String(raw.page || "1"), 10);
  const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

  return {
    q,
    actions,
    entityTypes,
    actor,
    from,
    to,
    sort,
    page,
    pageSize,
  };
}

export function buildAuditPrismaWhere(filters: AuditLogFilterState): Prisma.AuditLogWhereInput {
  const conditions: Prisma.AuditLogWhereInput[] = [];

  if (filters.q) {
    conditions.push({
      searchText: {
        contains: filters.q,
        mode: "insensitive",
      },
    });
  }

  if (filters.actions.length > 0) {
    conditions.push({
      action: { in: filters.actions },
    });
  }

  if (filters.entityTypes.length > 0) {
    conditions.push({
      entityType: { in: filters.entityTypes },
    });
  }

  if (filters.actor === "SYSTEM") {
    conditions.push({ userId: null });
  } else if (filters.actor) {
    conditions.push({ userId: filters.actor });
  }

  const { fromUtc, toUtc } = getIstDayBounds(filters.from, filters.to);
  if (fromUtc || toUtc) {
    conditions.push({
      createdAt: {
        ...(fromUtc ? { gte: fromUtc } : {}),
        ...(toUtc ? { lte: toUtc } : {}),
      },
    });
  }

  return conditions.length > 0 ? { AND: conditions } : {};
}

// ── CSV Escaping & Export ─────────────────────────────────────────────────────

export function escapeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return `""`;
  let str = String(value);
  // Formula injection defense: prefix =, +, -, @ with single quote
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export function formatAuditLogsAsCsv(rows: SerializedAuditLogRow[]): string {
  const headers = [
    "ID",
    "Timestamp (UTC)",
    "Action",
    "Category",
    "Entity Type",
    "Entity ID",
    "Entity Label",
    "Actor Status",
    "Actor Name",
    "Actor Email",
    "Payload",
  ];

  const lines = [headers.map((h) => `"${h}"`).join(",")];

  for (const r of rows) {
    const rowCells = [
      escapeCsvCell(r.id),
      escapeCsvCell(r.createdAtIso),
      escapeCsvCell(r.action),
      escapeCsvCell(r.actionCategory),
      escapeCsvCell(r.entityType),
      escapeCsvCell(r.entityId),
      escapeCsvCell(r.entity.label),
      escapeCsvCell(r.actor.status),
      escapeCsvCell(r.actor.name),
      escapeCsvCell(r.actor.email),
      escapeCsvCell(r.details ? JSON.stringify(r.details) : ""),
    ];
    lines.push(rowCells.join(","));
  }

  return lines.join("\r\n");
}

// ── Batch Resolution (Zero N+1) ───────────────────────────────────────────────

export async function resolveAuditLogRows(
  rawLogs: RawAuditLogRow[],
  client: any = db
): Promise<SerializedAuditLogRow[]> {
  if (!rawLogs || rawLogs.length === 0) return [];

  const userIds = Array.from(
    new Set(rawLogs.map((l) => l.userId).filter((id): id is string => Boolean(id)))
  );

  const projectIds: string[] = [];
  const providerIds: string[] = [];
  const requestIds: string[] = [];
  const targetUserIds: string[] = [];
  const inquiryIds: string[] = [];
  const transactionIds: string[] = [];
  const ticketIds: string[] = [];

  for (const l of rawLogs) {
    if (!l.entityId) continue;
    switch (l.entityType) {
      case "Project":
        projectIds.push(l.entityId);
        break;
      case "ProjectProvider":
        providerIds.push(l.entityId);
        break;
      case "CustomProjectRequest":
        requestIds.push(l.entityId);
        break;
      case "User":
        targetUserIds.push(l.entityId);
        break;
      case "Inquiry":
        inquiryIds.push(l.entityId);
        break;
      case "Transaction":
        transactionIds.push(l.entityId);
        break;
      case "SupportTicket":
        ticketIds.push(l.entityId);
        break;
    }
  }

  const allUserIds = Array.from(new Set([...userIds, ...targetUserIds]));

  // Batch query each relation at most once
  const [users, projects, providers, requests, inquiries, transactions, tickets] =
    await Promise.all([
      allUserIds.length && client.user
        ? client.user.findMany({
            where: { id: { in: allUserIds } },
            select: { id: true, name: true, email: true },
          })
        : [],
      projectIds.length && client.project
        ? client.project.findMany({
            where: { id: { in: Array.from(new Set(projectIds)) } },
            select: { id: true, title: true, slug: true },
          })
        : [],
      providerIds.length && client.projectProvider
        ? client.projectProvider.findMany({
            where: { id: { in: Array.from(new Set(providerIds)) } },
            select: { id: true, displayName: true, email: true },
          })
        : [],
      requestIds.length && client.customProjectRequest
        ? client.customProjectRequest.findMany({
            where: { id: { in: Array.from(new Set(requestIds)) } },
            select: { id: true, projectTitle: true },
          })
        : [],
      inquiryIds.length && client.inquiry
        ? client.inquiry.findMany({
            where: { id: { in: Array.from(new Set(inquiryIds)) } },
            select: { id: true, name: true, email: true },
          })
        : [],
      transactionIds.length && client.transaction
        ? client.transaction.findMany({
            where: { id: { in: Array.from(new Set(transactionIds)) } },
            select: { id: true, transactionNumber: true },
          })
        : [],
      ticketIds.length && client.supportTicket
        ? client.supportTicket.findMany({
            where: { id: { in: Array.from(new Set(ticketIds)) } },
            select: { id: true, subject: true },
          })
        : [],
    ]);

  const userMap = new Map<string, any>((users || []).map((u: any) => [u.id, u]));
  const projectMap = new Map<string, any>((projects || []).map((p: any) => [p.id, p]));
  const providerMap = new Map<string, any>((providers || []).map((pr: any) => [pr.id, pr]));
  const requestMap = new Map<string, any>((requests || []).map((r: any) => [r.id, r]));
  const inquiryMap = new Map<string, any>((inquiries || []).map((i: any) => [i.id, i]));
  const transactionMap = new Map<string, any>((transactions || []).map((t: any) => [t.id, t]));
  const ticketMap = new Map<string, any>((tickets || []).map((tk: any) => [tk.id, tk]));

  return rawLogs.map((log) => {
    // Actor resolution
    let actor: SerializedAuditLogRow["actor"];
    if (!log.userId) {
      actor = { id: null, status: "system", name: null, email: null, displayLabel: "System" };
    } else {
      const u = userMap.get(log.userId);
      if (u) {
        actor = {
          id: u.id,
          status: "resolved",
          name: u.name,
          email: u.email,
          displayLabel: u.name || u.email || "Admin",
        };
      } else {
        actor = {
          id: log.userId,
          status: "deleted",
          name: null,
          email: null,
          displayLabel: "Deleted user",
        };
      }
    }

    // Entity resolution
    let label: string | null = null;
    let href: string | null = null;
    const eId = log.entityId;

    switch (log.entityType) {
      case "Project": {
        const p = eId ? projectMap.get(eId) : null;
        label = p ? p.title : eId;
        href = eId ? `/admin/projects/${eId}/edit` : null;
        break;
      }
      case "ProjectProvider": {
        const pr = eId ? providerMap.get(eId) : null;
        label = pr ? pr.displayName : eId;
        href = eId ? `/admin/providers/${eId}/edit` : null;
        break;
      }
      case "CustomProjectRequest": {
        const req = eId ? requestMap.get(eId) : null;
        label = req ? req.projectTitle : eId;
        href = eId ? `/admin/custom-requests/${eId}` : null;
        break;
      }
      case "User": {
        const u = eId ? userMap.get(eId) : null;
        label = u ? u.email || u.name : eId;
        href = eId ? `/admin/profile` : null;
        break;
      }
      case "Inquiry": {
        const inq = eId ? inquiryMap.get(eId) : null;
        label = inq ? inq.name || inq.email : eId ? `Inquiry #${eId}` : null;
        href = eId ? `/admin/inquiries/${eId}` : null;
        break;
      }
      case "Transaction": {
        const tx = eId ? transactionMap.get(eId) : null;
        label = tx ? tx.transactionNumber || `Transaction #${eId}` : eId ? `Transaction #${eId}` : null;
        href = eId ? `/admin/transactions/${eId}` : null;
        break;
      }
      case "SupportTicket": {
        const st = eId ? ticketMap.get(eId) : null;
        label = st ? st.subject || `Ticket #${eId}` : eId ? `Ticket #${eId}` : null;
        href = eId ? `/admin/support/${eId}` : null;
        break;
      }
      default: {
        label = eId;
        href = null;
      }
    }

    return {
      id: log.id,
      userId: log.userId,
      action: log.action,
      actionCategory: getAuditActionCategory(log.action),
      entityType: log.entityType,
      entityId: log.entityId,
      details: redactPayload(log.details),
      createdAtIso: new Date(log.createdAt).toISOString(),
      actor,
      entity: {
        entityType: log.entityType,
        entityId: log.entityId,
        label,
        href,
      },
    };
  });
}

// ── Write Functions ──────────────────────────────────────────────────────────

/**
 * Write a new audit log entry with payload redaction and searchable text indexing.
 * Fails safely without throwing so that critical user flows are not disrupted.
 */
export async function createAuditLog(options: AuditOptions): Promise<void> {
  try {
    const redactedDetails = options.details ? redactPayload(options.details) : null;
    const searchText = buildAuditSearchText({
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId,
      userId: options.userId,
      details: redactedDetails,
    });

    await db.auditLog.create({
      data: {
        userId: options.userId ?? undefined,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId ?? undefined,
        details: redactedDetails ? (redactedDetails as Prisma.InputJsonValue) : Prisma.JsonNull,
        searchText,
      } as any,
    });
  } catch (error) {
    console.error("[AuditLog] Failed to write audit log:", error);
  }
}

/**
 * Transaction-bound audit writer. Unlike createAuditLog it never swallows errors:
 * if the audit row cannot be written the surrounding transaction rolls back, so a
 * privileged change can never be committed without its audit trail.
 */
export async function createAuditLogTx(
  tx: Prisma.TransactionClient,
  options: AuditOptions
): Promise<void> {
  const redactedDetails = options.details ? redactPayload(options.details) : null;
  const searchText = buildAuditSearchText({
    action: options.action,
    entityType: options.entityType,
    entityId: options.entityId,
    userId: options.userId,
    details: redactedDetails,
  });

  await tx.auditLog.create({
    data: {
      userId: options.userId ?? undefined,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId ?? undefined,
      details: redactedDetails ? (redactedDetails as Prisma.InputJsonValue) : Prisma.JsonNull,
      searchText,
    } as any,
  });
}

export const recordAuditLog = createAuditLog;

export const writeAuditLog = async (options: {
  userId?: string | null;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> => {
  return createAuditLog({
    userId: options.actorId || options.userId || null,
    action: options.action,
    entityType: options.entityType,
    entityId: options.entityId,
    details: options.metadata || options.details,
  });
};

/**
 * Query audit logs for the admin panel with filtering, search, resolution, and pagination.
 */
export async function getAdminAuditLogs(rawParams: Record<string, unknown> = {}) {
  const filters = parseAuditLogFilters(rawParams);
  const where = buildAuditPrismaWhere(filters);
  const skip = (filters.page - 1) * filters.pageSize;
  const orderBy = { createdAt: filters.sort === "oldest" ? ("asc" as const) : ("desc" as const) };

  const [rawLogs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      skip,
      take: filters.pageSize,
      orderBy,
    }),
    db.auditLog.count({ where }),
  ]);

  const resolvedLogs = await resolveAuditLogRows(rawLogs as any[]);

  const filterOptions: AuditFilterOptions = {
    distinctActions: [
      "PARTNER_ACTIVATED",
      "PARTNER_DEACTIVATED",
      "PROVIDER_REMOVED",
      "PROVIDER_RESTORED",
      "PROJECT_MODERATED",
      "PROJECT_PUBLISHED",
      "PROJECT_ARCHIVED",
      "USER_ROLE_UPDATED",
      "USER_LOGIN",
      "CUSTOM_REQUEST_RECEIVED",
    ],
    distinctEntityTypes: [
      "Project",
      "ProjectProvider",
      "CustomProjectRequest",
      "User",
      "Inquiry",
      "Transaction",
      "SupportTicket",
    ],
    actors: [
      { id: "SYSTEM", label: "System", name: "System", email: null },
    ],
  };

  return {
    logs: resolvedLogs,
    total,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    currentPage: filters.page,
    pageSize: filters.pageSize,
    filters,
    filterOptions,
  };
}

/**
 * Export filtered audit logs as a downloadable CSV string.
 * Caps export at 10,000 rows as per docs/32-audit-logging.md.
 */
export async function exportAdminAuditLogsCsv(rawParams: Record<string, unknown> = {}) {
  const filters = parseAuditLogFilters(rawParams);
  const where = buildAuditPrismaWhere(filters);
  const orderBy = { createdAt: filters.sort === "oldest" ? ("asc" as const) : ("desc" as const) };

  const rawLogs = await db.auditLog.findMany({
    where,
    take: 10000,
    orderBy,
  });

  const resolved = await resolveAuditLogRows(rawLogs as any[]);
  const csv = formatAuditLogsAsCsv(resolved);

  return { csv, count: resolved.length };
}

