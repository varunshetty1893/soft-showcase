// lib/db/audit.ts
// Audit logging service & Phase 5 query/search/filter/batch-resolution/CSV-export engine.
// Source of truth: docs/32-audit-logging.md & Phase 5 specification.
//
// Key guarantees:
// - Audit rows are strictly append-only (no update or delete path exists in code or UI).
// - All payloads are passed through redactPayload() before persisting and before building searchText.
// - searchText is populated at write time (lowercased action + entityType + entityId + actor + flattened redacted payload).
// - Actors and entities are resolved in batches per entity type (zero N+1 queries).
// - CSV export is capped at 10,000 rows and protected against formula injection (=, +, -, @).

import { db, ensureAdditiveSchema } from "@/lib/db/client";
import { Prisma } from "@prisma/client";

export const MAX_AUDIT_SEARCH_LENGTH = 100;
export const MAX_AUDIT_CSV_ROWS = 10_000;
export const ALLOWED_AUDIT_PAGE_SIZES = [25, 50, 100] as const;
export type AuditPageSize = (typeof ALLOWED_AUDIT_PAGE_SIZES)[number];

const SENSITIVE_KEY_PATTERN =
  /^(password|passwordhash|newpassword|oldpassword|currentpassword|token|accesstoken|refreshtoken|idtoken|sessiontoken|resettoken|verificationtoken|secret|clientsecret|authsecret|otp|codehash|authorization|apikey|privatekey|cookie|set-cookie)$/i;

/**
 * Redact sensitive keys (password, passwordHash, token, secret, otp, codeHash, authorization, etc.)
 * recursively in any audit log payload before storage or display.
 */
export function redactPayload(input: unknown): unknown {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) {
    return input.map((item) => redactPayload(item));
  }
  if (input instanceof Date) {
    return input.toISOString();
  }
  if (typeof input === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input as Record<string, unknown>)) {
      const normalizedKey = key.replace(/[_-\s]/g, "");
      if (SENSITIVE_KEY_PATTERN.test(key) || SENSITIVE_KEY_PATTERN.test(normalizedKey)) {
        out[key] = "[REDACTED]";
      } else {
        out[key] = redactPayload(val);
      }
    }
    return out;
  }
  return input;
}

/**
 * Flatten a redacted payload into space-separated tokens for searchText indexing.
 */
function flattenPayloadTokens(value: unknown, bucket: string[] = []): string[] {
  if (value === null || value === undefined) return bucket;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const str = String(value).trim();
    if (str && str !== "[REDACTED]") {
      bucket.push(str);
    }
    return bucket;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      flattenPayloadTokens(item, bucket);
    }
    return bucket;
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      bucket.push(k);
      flattenPayloadTokens(v, bucket);
    }
  }
  return bucket;
}

/**
 * Build lowercased searchText for an audit log row at write time:
 * action + entityType + entityId + actor (id/name/email or "system") + entityLabel + flattened redacted payload.
 */
export function buildAuditSearchText(params: {
  action: string;
  entityType: string;
  entityId?: string | null;
  userId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  entityLabel?: string | null;
  details?: unknown;
}): string {
  const redacted = redactPayload(params.details);
  const payloadTokens = flattenPayloadTokens(redacted);

  const parts = [
    params.action,
    params.entityType,
    params.entityId || "",
    params.userId || "system",
    params.actorName || "",
    params.actorEmail || "",
    params.entityLabel || "",
    ...payloadTokens,
  ]
    .map((p) => String(p || "").trim())
    .filter(Boolean);

  return parts.join(" ").toLowerCase().replace(/\s+/g, " ").trim();
}

export interface AuditOptions {
  userId?: string | null;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Write a new immutable audit log entry.
 * Redacts sensitive keys in details and populates searchText at write time.
 * Fails safely without throwing so critical user flows are not disrupted.
 */
export async function createAuditLog(options: AuditOptions): Promise<void> {
  try {
    await ensureAdditiveSchema();
    const resolvedUserId = options.userId ?? options.actorId ?? null;
    const rawDetails = options.details ?? options.metadata ?? null;
    const safeDetails = rawDetails
      ? (redactPayload(rawDetails) as Record<string, unknown>)
      : null;

    let actorName: string | null = null;
    let actorEmail: string | null = null;
    if (resolvedUserId) {
      try {
        const actor = await db.user.findUnique({
          where: { id: resolvedUserId },
          select: { name: true, email: true },
        });
        actorName = actor?.name ?? null;
        actorEmail = actor?.email ?? null;
      } catch {
        // Non-fatal if actor lookup fails
      }
    }

    const searchText = buildAuditSearchText({
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId ?? null,
      userId: resolvedUserId,
      actorName,
      actorEmail,
      details: safeDetails,
    });

    await db.auditLog.create({
      data: {
        userId: resolvedUserId ?? undefined,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId ?? undefined,
        details: safeDetails
          ? (safeDetails as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        searchText,
      },
    });
  } catch (error) {
    // Non-blocking error handling as per docs/32-audit-logging.md
    console.error("[AuditLog] Failed to write audit log:", error);
  }
}

export const recordAuditLog = createAuditLog;
export const writeAuditLog = createAuditLog;

// ── Phase 5: IST Day Bounds, Filter Parsing & Action Categorization ─────────

/**
 * Compute inclusive UTC Date bounds for IST (Asia/Kolkata, UTC+05:30) YYYY-MM-DD strings.
 * - fromDateStr ("2026-06-15") -> 2026-06-15T00:00:00.000+05:30 (2026-06-14T18:30:00.000Z)
 * - toDateStr   ("2026-06-15") -> 2026-06-15T23:59:59.999+05:30 (2026-06-15T18:29:59.999Z)
 */
export function getIstDayBounds(
  fromDateStr?: string | null,
  toDateStr?: string | null
): { fromUtc: Date | null; toUtc: Date | null } {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  let fromUtc: Date | null = null;
  let toUtc: Date | null = null;

  if (fromDateStr && dateRegex.test(fromDateStr.trim())) {
    const d = new Date(`${fromDateStr.trim()}T00:00:00.000+05:30`);
    if (!Number.isNaN(d.getTime())) {
      fromUtc = d;
    }
  }

  if (toDateStr && dateRegex.test(toDateStr.trim())) {
    const d = new Date(`${toDateStr.trim()}T23:59:59.999+05:30`);
    if (!Number.isNaN(d.getTime())) {
      toUtc = d;
    }
  }

  return { fromUtc, toUtc };
}

export interface AuditLogFilterState {
  q: string;
  actions: string[];
  entityTypes: string[];
  actor: string; // "" (all) | "SYSTEM" | userId
  from: string; // YYYY-MM-DD (IST) or ""
  to: string; // YYYY-MM-DD (IST) or ""
  sort: "newest" | "oldest";
  pageSize: AuditPageSize;
  page: number;
}

function parseMultiParam(val: string | string[] | undefined): string[] {
  if (!val) return [];
  const rawList = Array.isArray(val) ? val : [val];
  const split = rawList
    .flatMap((item) => String(item).split(","))
    .map((s) => s.trim())
    .filter(Boolean);
  return Array.from(new Set(split));
}

function parseSingleParam(val: string | string[] | undefined): string {
  if (!val) return "";
  if (Array.isArray(val)) return String(val[0] || "").trim();
  return String(val).trim();
}

/**
 * Parse URL searchParams or query options into a normalized AuditLogFilterState.
 */
export function parseAuditLogFilters(
  raw: Record<string, string | string[] | number | undefined> = {}
): AuditLogFilterState {
  const qRaw = parseSingleParam(raw.q as string | string[] | undefined);
  const q = qRaw.slice(0, MAX_AUDIT_SEARCH_LENGTH);

  const actions = parseMultiParam(
    (raw.actions ?? raw.action) as string | string[] | undefined
  );
  const entityTypes = parseMultiParam(
    (raw.entityTypes ?? raw.entityType) as string | string[] | undefined
  );

  const actor = parseSingleParam(raw.actor as string | string[] | undefined);

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const fromCandidate = parseSingleParam(raw.from as string | string[] | undefined);
  const toCandidate = parseSingleParam(raw.to as string | string[] | undefined);
  const from = dateRegex.test(fromCandidate) ? fromCandidate : "";
  const to = dateRegex.test(toCandidate) ? toCandidate : "";

  const sortRaw = parseSingleParam(raw.sort as string | string[] | undefined).toLowerCase();
  const sort: "newest" | "oldest" = sortRaw === "oldest" ? "oldest" : "newest";

  const pageSizeNum = Number(raw.pageSize);
  const pageSize: AuditPageSize = ALLOWED_AUDIT_PAGE_SIZES.includes(
    pageSizeNum as AuditPageSize
  )
    ? (pageSizeNum as AuditPageSize)
    : 25;

  const pageNum = Number(raw.page);
  const page = Number.isInteger(pageNum) && pageNum >= 1 ? pageNum : 1;

  return {
    q,
    actions,
    entityTypes,
    actor,
    from,
    to,
    sort,
    pageSize,
    page,
  };
}

export type AuditActionCategory = "created_approved" | "rejected_deleted" | "updated";

/**
 * Categorize an audit action constant for colour-coded UI badges.
 */
export function getAuditActionCategory(action: string): AuditActionCategory {
  const upper = (action || "").toUpperCase();
  if (
    upper.includes("CREATED") ||
    upper.includes("APPROVED") ||
    upper.includes("ACTIVATED") ||
    upper.includes("REACTIVATED") ||
    upper.includes("RESTORED") ||
    upper.includes("PUBLISHED") ||
    upper.includes("IMPORTED") ||
    upper.includes("VERIFIED") ||
    upper.includes("CONFIRMED") ||
    upper.includes("RECEIVED")
  ) {
    return "created_approved";
  }
  if (
    upper.includes("REJECTED") ||
    upper.includes("DELETED") ||
    upper.includes("REMOVED") ||
    upper.includes("DEACTIVATED") ||
    upper.includes("DENIED") ||
    upper.includes("SUSPENDED") ||
    upper.includes("ENDED") ||
    upper.includes("ARCHIVED") ||
    upper.includes("BLOCKED") ||
    upper.includes("FAILED")
  ) {
    return "rejected_deleted";
  }
  return "updated";
}

// ── Phase 5: Batch Actor & Entity Resolution (No N+1) ───────────────────────

export interface RawAuditLogRow {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: unknown;
  searchText?: string | null;
  createdAt: Date | string;
}

export interface ResolvedAuditActor {
  id: string | null;
  status: "system" | "resolved" | "deleted";
  name: string | null;
  email: string | null;
  displayLabel: string;
}

export interface ResolvedAuditEntity {
  entityType: string;
  entityId: string | null;
  label: string | null;
  href: string | null;
}

export interface EnrichedAuditLogRow extends RawAuditLogRow {
  createdAt: Date;
  details: unknown; // Always redacted
  actionCategory: AuditActionCategory;
  actor: ResolvedAuditActor;
  entity: ResolvedAuditEntity;
}

/**
 * Resolve actor IDs and entity IDs across a list of audit logs in batch queries per entity type (zero N+1).
 * - userId === null -> "System"
 * - userId missing in users table -> "Deleted user"
 * - Project -> title + link to /admin/projects/[id]/edit (when project exists)
 * - ProjectProvider -> displayName + link to /admin/providers/[id]/edit (when provider exists)
 * - CustomProjectRequest -> projectTitle + link to /admin/custom-requests/[id] (when request exists)
 * - User -> email
 */
export async function resolveAuditLogRows(
  logs: RawAuditLogRow[],
  client: typeof db = db
): Promise<EnrichedAuditLogRow[]> {
  if (logs.length === 0) return [];

  const actorUserIds = new Set<string>();
  const projectIds = new Set<string>();
  const providerIds = new Set<string>();
  const customRequestIds = new Set<string>();
  const targetUserIds = new Set<string>();
  const inquiryIds = new Set<string>();
  const transactionIds = new Set<string>();
  const ticketIds = new Set<string>();

  for (const log of logs) {
    if (log.userId) {
      actorUserIds.add(log.userId);
    }
    const id = log.entityId;
    if (!id) continue;
    const type = (log.entityType || "").trim();
    if (type === "Project") projectIds.add(id);
    else if (type === "ProjectProvider" || type === "Provider" || type === "Partner")
      providerIds.add(id);
    else if (type === "CustomProjectRequest") customRequestIds.add(id);
    else if (type === "User") targetUserIds.add(id);
    else if (type === "Inquiry") inquiryIds.add(id);
    else if (type === "Transaction") transactionIds.add(id);
    else if (type === "SupportTicket") ticketIds.add(id);
  }

  const allUserIds = Array.from(new Set([...actorUserIds, ...targetUserIds]));

  // Execute at most ONE query per distinct entity type present in the batch
  const [
    usersBatch,
    projectsBatch,
    providersBatch,
    customRequestsBatch,
    inquiriesBatch,
    transactionsBatch,
    ticketsBatch,
  ] = await Promise.all([
    allUserIds.length > 0
      ? client.user
          .findMany({
            where: { id: { in: allUserIds } },
            select: { id: true, name: true, email: true },
          })
          .catch(() => [])
      : Promise.resolve([]),
    projectIds.size > 0
      ? client.project
          .findMany({
            where: { id: { in: Array.from(projectIds) } },
            select: { id: true, title: true, slug: true },
          })
          .catch(() => [])
      : Promise.resolve([]),
    providerIds.size > 0
      ? client.projectProvider
          .findMany({
            where: { id: { in: Array.from(providerIds) } },
            select: { id: true, displayName: true, email: true },
          })
          .catch(() => [])
      : Promise.resolve([]),
    customRequestIds.size > 0
      ? client.customProjectRequest
          .findMany({
            where: { id: { in: Array.from(customRequestIds) } },
            select: { id: true, projectTitle: true },
          })
          .catch(() => [])
      : Promise.resolve([]),
    inquiryIds.size > 0
      ? client.inquiry
          .findMany({
            where: { id: { in: Array.from(inquiryIds) } },
            select: { id: true, name: true, email: true },
          })
          .catch(() => [])
      : Promise.resolve([]),
    transactionIds.size > 0
      ? client.transaction
          .findMany({
            where: { id: { in: Array.from(transactionIds) } },
            select: { id: true, transactionNumber: true },
          })
          .catch(() => [])
      : Promise.resolve([]),
    ticketIds.size > 0
      ? client.supportTicket
          .findMany({
            where: { id: { in: Array.from(ticketIds) } },
            select: { id: true, ticketNumber: true, subject: true },
          })
          .catch(() => [])
      : Promise.resolve([]),
  ]);

  const userMap = new Map<string, { id: string; name: string | null; email: string }>();
  for (const u of usersBatch as Array<{ id: string; name: string | null; email: string }>) {
    userMap.set(u.id, u);
  }

  const projectMap = new Map<string, { id: string; title: string; slug: string }>();
  for (const p of projectsBatch as Array<{ id: string; title: string; slug: string }>) {
    projectMap.set(p.id, p);
  }

  const providerMap = new Map<string, { id: string; displayName: string; email: string }>();
  for (const pr of providersBatch as Array<{ id: string; displayName: string; email: string }>) {
    providerMap.set(pr.id, pr);
  }

  const customRequestMap = new Map<string, { id: string; projectTitle: string }>();
  for (const cr of customRequestsBatch as Array<{ id: string; projectTitle: string }>) {
    customRequestMap.set(cr.id, cr);
  }

  const inquiryMap = new Map<string, { id: string; name: string; email: string }>();
  for (const inq of inquiriesBatch as Array<{ id: string; name: string; email: string }>) {
    inquiryMap.set(inq.id, inq);
  }

  const transactionMap = new Map<string, { id: string; transactionNumber: string }>();
  for (const tx of transactionsBatch as Array<{ id: string; transactionNumber: string }>) {
    transactionMap.set(tx.id, tx);
  }

  const ticketMap = new Map<string, { id: string; ticketNumber: string; subject: string }>();
  for (const tk of ticketsBatch as Array<{ id: string; ticketNumber: string; subject: string }>) {
    ticketMap.set(tk.id, tk);
  }

  return logs.map((log) => {
    const safeDetails = log.details ? redactPayload(log.details) : null;
    const detailsObj =
      safeDetails && typeof safeDetails === "object" && !Array.isArray(safeDetails)
        ? (safeDetails as Record<string, unknown>)
        : null;

    // 1. Resolve Actor
    let actor: ResolvedAuditActor;
    if (!log.userId) {
      actor = {
        id: null,
        status: "system",
        name: "System",
        email: null,
        displayLabel: "System",
      };
    } else {
      const foundUser = userMap.get(log.userId);
      if (foundUser) {
        actor = {
          id: foundUser.id,
          status: "resolved",
          name: foundUser.name || null,
          email: foundUser.email,
          displayLabel: foundUser.name
            ? `${foundUser.name} (${foundUser.email})`
            : foundUser.email,
        };
      } else {
        actor = {
          id: log.userId,
          status: "deleted",
          name: "Deleted user",
          email: null,
          displayLabel: "Deleted user",
        };
      }
    }

    // 2. Resolve Entity label & admin link
    const type = (log.entityType || "").trim();
    const entityId = log.entityId || null;
    let label: string | null = null;
    let href: string | null = null;

    if (entityId) {
      if (type === "Project") {
        const proj = projectMap.get(entityId);
        if (proj) {
          label = proj.title;
          href = `/admin/projects/${proj.id}/edit`;
        } else if (typeof detailsObj?.title === "string") {
          label = `${detailsObj.title} (deleted)`;
        }
      } else if (type === "ProjectProvider" || type === "Provider" || type === "Partner") {
        const prov = providerMap.get(entityId);
        if (prov) {
          label = prov.displayName;
          href = `/admin/providers/${prov.id}/edit`;
        } else if (typeof detailsObj?.displayName === "string") {
          label = `${detailsObj.displayName} (deleted)`;
        }
      } else if (type === "CustomProjectRequest") {
        const req = customRequestMap.get(entityId);
        if (req) {
          label = req.projectTitle;
          href = `/admin/custom-requests/${req.id}`;
        } else if (typeof detailsObj?.projectTitle === "string") {
          label = detailsObj.projectTitle;
        }
      } else if (type === "User") {
        const u = userMap.get(entityId);
        if (u) {
          label = u.email;
        } else if (typeof detailsObj?.email === "string") {
          label = detailsObj.email;
        }
      } else if (type === "Inquiry") {
        const inq = inquiryMap.get(entityId);
        if (inq) {
          label = `${inq.name} (${inq.email})`;
          href = `/admin/inquiries/${inq.id}`;
        }
      } else if (type === "Transaction") {
        const tx = transactionMap.get(entityId);
        if (tx) {
          label = tx.transactionNumber;
          href = `/admin/transactions`;
        } else if (typeof detailsObj?.transactionNumber === "string") {
          label = detailsObj.transactionNumber;
        }
      } else if (type === "SupportTicket") {
        const tk = ticketMap.get(entityId);
        if (tk) {
          label = `${tk.ticketNumber}: ${tk.subject}`;
          href = `/admin/support/${tk.id}`;
        } else if (typeof detailsObj?.ticketNumber === "string") {
          label = String(detailsObj.ticketNumber);
        }
      }
    }

    return {
      ...log,
      createdAt: log.createdAt instanceof Date ? log.createdAt : new Date(log.createdAt),
      details: safeDetails,
      actionCategory: getAuditActionCategory(log.action),
      actor,
      entity: {
        entityType: type,
        entityId,
        label,
        href,
      },
    };
  });
}

// ── Phase 5: Prisma Where Clause Builder & Query Engine ─────────────────────

export function buildAuditPrismaWhere(
  filters: AuditLogFilterState
): Prisma.AuditLogWhereInput {
  const andConditions: Prisma.AuditLogWhereInput[] = [];

  if (filters.actions.length === 1) {
    andConditions.push({ action: filters.actions[0] });
  } else if (filters.actions.length > 1) {
    andConditions.push({ action: { in: filters.actions } });
  }

  if (filters.entityTypes.length === 1) {
    andConditions.push({ entityType: filters.entityTypes[0] });
  } else if (filters.entityTypes.length > 1) {
    andConditions.push({ entityType: { in: filters.entityTypes } });
  }

  if (filters.actor) {
    if (filters.actor.toUpperCase() === "SYSTEM") {
      andConditions.push({ userId: null });
    } else {
      andConditions.push({ userId: filters.actor });
    }
  }

  const { fromUtc, toUtc } = getIstDayBounds(filters.from, filters.to);
  if (fromUtc || toUtc) {
    andConditions.push({
      createdAt: {
        ...(fromUtc ? { gte: fromUtc } : {}),
        ...(toUtc ? { lte: toUtc } : {}),
      },
    });
  }

  if (filters.q) {
    const qLower = filters.q.toLowerCase();
    andConditions.push({
      OR: [
        { searchText: { contains: qLower, mode: "insensitive" } },
        { action: { contains: filters.q, mode: "insensitive" } },
        { entityType: { contains: filters.q, mode: "insensitive" } },
        { entityId: { contains: filters.q, mode: "insensitive" } },
        { userId: { contains: filters.q, mode: "insensitive" } },
      ],
    });
  }

  if (andConditions.length === 0) return {};
  if (andConditions.length === 1) return andConditions[0];
  return { AND: andConditions };
}

export interface AuditActorOption {
  id: string; // "SYSTEM" or user.id
  label: string;
  email: string | null;
}

export interface AuditFilterOptions {
  distinctActions: string[];
  distinctEntityTypes: string[];
  actors: AuditActorOption[];
}

/**
 * Query audit logs for the admin panel with search, multi-select filters, IST date bounds,
 * sort order, configurable page size (25/50/100), and batch entity/actor resolution.
 */
export async function getAdminAuditLogs(
  rawOptions: Record<string, string | string[] | number | undefined> = {}
) {
  await ensureAdditiveSchema();
  const filters = parseAuditLogFilters(rawOptions);
  const where = buildAuditPrismaWhere(filters);
  const skip = (filters.page - 1) * filters.pageSize;
  const orderBy: Prisma.AuditLogOrderByWithRelationInput = {
    createdAt: filters.sort === "oldest" ? "asc" : "desc",
  };

  // If searching by actor name/email and some legacy rows didn't have actor name in searchText,
  // also check matching userIds from User table so `q` matches actor name/email even on pre-backfill rows!
  if (filters.q) {
    try {
      const matchingUsers = await db.user.findMany({
        where: {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { email: { contains: filters.q, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });
      if (matchingUsers.length > 0) {
        const matchedIds = matchingUsers.map((u) => u.id);
        // Append userId: { in: matchedIds } to the OR clause inside `where`
        const addActorMatchToOr = (w: any) => {
          if (Array.isArray(w.OR)) {
            w.OR.push({ userId: { in: matchedIds } });
          } else if (Array.isArray(w.AND)) {
            for (const sub of w.AND) addActorMatchToOr(sub);
          }
        };
        addActorMatchToOr(where);
      }
    } catch {
      // Ignore if mock store doesn't need extra OR clause
    }
  }

  const [rawLogs, total, allForDistinct, adminUsers] = await Promise.all([
    db.auditLog.findMany({
      where,
      skip,
      take: filters.pageSize,
      orderBy,
    }),
    db.auditLog.count({ where }),
    db.auditLog
      .findMany({
        select: { action: true, entityType: true, userId: true },
        orderBy: { createdAt: "desc" },
        take: 1000,
      })
      .catch(() => []),
    db.user
      .findMany({
        where: { isAdmin: true },
        select: { id: true, name: true, email: true },
      })
      .catch(() => []),
  ]);

  const enrichedLogs = await resolveAuditLogRows(rawLogs as RawAuditLogRow[]);

  const distinctActions = Array.from(
    new Set((allForDistinct as Array<{ action: string }>).map((r) => r.action).filter(Boolean))
  ).sort();

  const distinctEntityTypes = Array.from(
    new Set(
      (allForDistinct as Array<{ entityType: string }>)
        .map((r) => r.entityType)
        .filter(Boolean)
    )
  ).sort();

  // Build actors filter list: "System" + all admins + any distinct userIds present in audit logs
  const actorMap = new Map<string, AuditActorOption>();
  actorMap.set("SYSTEM", { id: "SYSTEM", label: "System", email: null });

  for (const adm of adminUsers as Array<{ id: string; name: string | null; email: string }>) {
    actorMap.set(adm.id, {
      id: adm.id,
      label: adm.name ? `${adm.name} (${adm.email})` : adm.email,
      email: adm.email,
    });
  }

  const extraActorIds = Array.from(
    new Set(
      (allForDistinct as Array<{ userId: string | null }>)
        .map((r) => r.userId)
        .filter((id): id is string => Boolean(id) && !actorMap.has(id!))
    )
  );

  if (extraActorIds.length > 0) {
    const extraUsers = await db.user
      .findMany({
        where: { id: { in: extraActorIds } },
        select: { id: true, name: true, email: true },
      })
      .catch(() => []);
    const foundSet = new Set<string>();
    for (const u of extraUsers as Array<{ id: string; name: string | null; email: string }>) {
      foundSet.add(u.id);
      actorMap.set(u.id, {
        id: u.id,
        label: u.name ? `${u.name} (${u.email})` : u.email,
        email: u.email,
      });
    }
    for (const missingId of extraActorIds) {
      if (!foundSet.has(missingId)) {
        actorMap.set(missingId, {
          id: missingId,
          label: `Deleted user (${missingId.slice(0, 8)})`,
          email: null,
        });
      }
    }
  }

  return {
    logs: enrichedLogs,
    total,
    totalPages: Math.max(1, Math.ceil(total / filters.pageSize)),
    currentPage: filters.page,
    pageSize: filters.pageSize,
    filters,
    filterOptions: {
      distinctActions,
      distinctEntityTypes,
      actors: Array.from(actorMap.values()),
    } satisfies AuditFilterOptions,
  };
}

// ── Phase 5: CSV Injection Protection & Export ──────────────────────────────

const CSV_FORMULA_PREFIX_REGEX = /^[\s]*[=+\-@]/;

/**
 * Escape a single value for safe CSV export.
 * Prefixes cells starting with `=`, `+`, `-`, `@` (or leading tab/CR) with a single quote `'`
 * to prevent spreadsheet formula injection (CSV injection), then applies RFC 4180 quoting.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str =
    typeof value === "string"
      ? value
      : value instanceof Date
      ? value.toISOString()
      : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);

  if (
    CSV_FORMULA_PREFIX_REGEX.test(str) ||
    str.startsWith("\t") ||
    str.startsWith("\r")
  ) {
    str = `'${str}`;
  }

  const escapedQuotes = str.replace(/"/g, '""');
  return `"${escapedQuotes}"`;
}

/**
 * Format enriched audit log rows into a complete CSV document.
 */
export function formatAuditLogsAsCsv(rows: EnrichedAuditLogRow[]): string {
  const headers = [
    "ID",
    "Timestamp (UTC)",
    "Action",
    "Entity Type",
    "Entity ID",
    "Entity Label",
    "Actor ID",
    "Actor Name",
    "Actor Email",
    "Payload (Redacted JSON)",
  ];

  const lines: string[] = [headers.map((h) => escapeCsvCell(h)).join(",")];

  for (const row of rows) {
    const cells = [
      row.id,
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt).toISOString(),
      row.action,
      row.entity.entityType,
      row.entity.entityId || "",
      row.entity.label || "",
      row.actor.id || "SYSTEM",
      row.actor.name || (row.actor.status === "system" ? "System" : "Deleted user"),
      row.actor.email || "",
      row.details ? JSON.stringify(redactPayload(row.details)) : "",
    ];
    lines.push(cells.map((c) => escapeCsvCell(c)).join(","));
  }

  return lines.join("\r\n");
}

/**
 * Export the current filtered audit log set as CSV (admin only, capped at 10,000 rows).
 */
export async function exportAdminAuditLogsCsv(
  rawParams: Record<string, string | string[] | number | undefined> = {}
): Promise<{ csv: string; count: number }> {
  await ensureAdditiveSchema();
  const filters = parseAuditLogFilters(rawParams);
  const where = buildAuditPrismaWhere(filters);
  const orderBy: Prisma.AuditLogOrderByWithRelationInput = {
    createdAt: filters.sort === "oldest" ? "asc" : "desc",
  };

  const rawLogs = await db.auditLog.findMany({
    where,
    take: MAX_AUDIT_CSV_ROWS,
    orderBy,
  });

  const enriched = await resolveAuditLogRows(rawLogs as RawAuditLogRow[]);
  const csv = formatAuditLogsAsCsv(enriched);
  return { csv, count: enriched.length };
}
