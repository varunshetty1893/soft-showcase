// tests/unit/audit-logs.test.ts
// Unit tests for Phase 5 — Audit Logs:
// - Filter combinations (multi-select action, multi-select entityType, actor, sort, pageSize, page)
// - Search q (max 100 chars, searchText generation, matches action, entity, actor name/email, and payload)
// - IST day bounds (inclusive Asia/Kolkata 00:00:00.000+05:30 to 23:59:59.999+05:30)
// - Redaction (password, passwordHash, token, secret, otp, codeHash, authorization -> [REDACTED])
// - CSV escaping & formula injection protection (prefixes =, +, -, @ with ')
// - Batch resolution (Project -> title, ProjectProvider -> displayName, CustomProjectRequest -> projectTitle,
//   User -> email, Actor -> name + email / "System" / "Deleted user", with zero N+1 queries)
// - Test isolation guard (assertTestDbIsolation aborts when a real DATABASE_URL is present)
// - Immutability (audit rows cannot be updated or deleted)

import { describe, it, expect, vi } from "vitest";
import {
  redactPayload,
  buildAuditSearchText,
  getIstDayBounds,
  parseAuditLogFilters,
  buildAuditPrismaWhere,
  getAuditActionCategory,
  escapeCsvCell,
  formatAuditLogsAsCsv,
  resolveAuditLogRows,
  getAdminAuditLogs,
  createAuditLog,
  type RawAuditLogRow,
} from "@/lib/db/audit";
import { assertTestDbIsolation } from "../setup";
import { db } from "@/lib/db/client";

describe("Phase 5 — Audit Logs: Search, Filters, Readable Rows, Redaction & CSV Export", () => {
  describe("1. Payload Redaction (redactPayload & buildAuditSearchText)", () => {
    it("redacts password, passwordHash, token, secret, otp, codeHash, authorization recursively", () => {
      const raw = {
        email: "partner@example.com",
        password: "plain-secret-password",
        passwordHash: "$2b$12$abcdefghijk",
        token: "jwt-token-xyz",
        secret: "totp-secret-123",
        otp: "849201",
        codeHash: "sha256-hash-of-otp",
        authorization: "Bearer eyJhbGciOi...",
        nested: {
          accessToken: "nested-access-token",
          refresh_token: "nested-refresh-token",
          safeNote: "Approved after review",
        },
        items: [
          { apiKey: "sk-live-12345", label: "Visible item" },
        ],
      };

      const redacted = redactPayload(raw) as Record<string, any>;

      expect(redacted.email).toBe("partner@example.com");
      expect(redacted.password).toBe("[REDACTED]");
      expect(redacted.passwordHash).toBe("[REDACTED]");
      expect(redacted.token).toBe("[REDACTED]");
      expect(redacted.secret).toBe("[REDACTED]");
      expect(redacted.otp).toBe("[REDACTED]");
      expect(redacted.codeHash).toBe("[REDACTED]");
      expect(redacted.authorization).toBe("[REDACTED]");
      expect(redacted.nested.accessToken).toBe("[REDACTED]");
      expect(redacted.nested.refresh_token).toBe("[REDACTED]");
      expect(redacted.nested.safeNote).toBe("Approved after review");
      expect(redacted.items[0].apiKey).toBe("[REDACTED]");
      expect(redacted.items[0].label).toBe("Visible item");

      // Confirm searchText never indexes redacted secret values
      const searchText = buildAuditSearchText({
        action: "USER_LOGIN",
        entityType: "User",
        entityId: "user-123",
        userId: "user-admin",
        actorName: "Varun Admin",
        actorEmail: "admin@example.com",
        details: raw,
      });

      expect(searchText).toContain("user_login");
      expect(searchText).toContain("partner@example.com");
      expect(searchText).toContain("varun admin");
      expect(searchText).toContain("approved after review");
      expect(searchText).not.toContain("plain-secret-password");
      expect(searchText).not.toContain("jwt-token-xyz");
      expect(searchText).not.toContain("849201");
      expect(searchText).not.toContain("sk-live-12345");
    });
  });

  describe("2. Inclusive IST Day Bounds (getIstDayBounds)", () => {
    it("computes inclusive start and end of day in IST (UTC+05:30)", () => {
      const { fromUtc, toUtc } = getIstDayBounds("2026-10-02", "2026-10-02");

      expect(fromUtc).not.toBeNull();
      expect(toUtc).not.toBeNull();

      // 2026-10-02 00:00:00.000+05:30 === 2026-10-01T18:30:00.000Z
      expect(fromUtc!.toISOString()).toBe("2026-10-01T18:30:00.000Z");
      // 2026-10-02 23:59:59.999+05:30 === 2026-10-02T18:29:59.999Z
      expect(toUtc!.toISOString()).toBe("2026-10-02T18:29:59.999Z");
    });

    it("returns null for empty or malformed date strings", () => {
      const res = getIstDayBounds("invalid-date", "");
      expect(res.fromUtc).toBeNull();
      expect(res.toUtc).toBeNull();
    });
  });

  describe("3. Filter Combinations & Search Query Parsing", () => {
    it("parses multi-select actions, entityTypes, actor, IST date bounds, sort, pageSize, and truncates q to 100 chars", () => {
      const longQuery = "a".repeat(140);
      const parsed = parseAuditLogFilters({
        q: longQuery,
        action: ["PARTNER_ACTIVATED,PARTNER_DEACTIVATED", "PROVIDER_REMOVED"],
        entityType: ["ProjectProvider", "Project"],
        actor: "SYSTEM",
        from: "2026-05-01",
        to: "2026-05-31",
        sort: "oldest",
        pageSize: "50",
        page: "3",
      });

      expect(parsed.q).toHaveLength(100);
      expect(parsed.actions).toEqual([
        "PARTNER_ACTIVATED",
        "PARTNER_DEACTIVATED",
        "PROVIDER_REMOVED",
      ]);
      expect(parsed.entityTypes).toEqual(["ProjectProvider", "Project"]);
      expect(parsed.actor).toBe("SYSTEM");
      expect(parsed.from).toBe("2026-05-01");
      expect(parsed.to).toBe("2026-05-31");
      expect(parsed.sort).toBe("oldest");
      expect(parsed.pageSize).toBe(50);
      expect(parsed.page).toBe(3);

      const prismaWhere = buildAuditPrismaWhere(parsed) as any;
      expect(prismaWhere.AND).toBeDefined();
      expect(prismaWhere.AND).toEqual(
        expect.arrayContaining([
          {
            action: {
              in: [
                "PARTNER_ACTIVATED",
                "PARTNER_DEACTIVATED",
                "PROVIDER_REMOVED",
              ],
            },
          },
          { entityType: { in: ["ProjectProvider", "Project"] } },
          { userId: null }, // SYSTEM actor
        ])
      );
    });

    it("categorizes action constants into created_approved, rejected_deleted, and updated", () => {
      expect(getAuditActionCategory("PARTNER_ACTIVATED")).toBe("created_approved");
      expect(getAuditActionCategory("PROJECT_PUBLISHED")).toBe("created_approved");
      expect(getAuditActionCategory("PROVIDER_RESTORED")).toBe("created_approved");
      expect(getAuditActionCategory("PROVIDER_REMOVED")).toBe("rejected_deleted");
      expect(getAuditActionCategory("ADMIN_EDIT_DENIED")).toBe("rejected_deleted");
      expect(getAuditActionCategory("PROJECT_MODERATED")).toBe("updated");
    });
  });

  describe("4. Batch Resolution of Actors & Entities (Zero N+1)", () => {
    it("resolves actors (name+email, System, Deleted user) and entity labels with 1 batch query per entity type", async () => {
      const mockClient = {
        user: {
          findMany: vi.fn().mockResolvedValue([
            { id: "admin-1", name: "Varun Admin", email: "varun@admin.dev" },
            { id: "target-user-1", name: "Customer Jane", email: "jane@customer.dev" },
          ]),
        },
        project: {
          findMany: vi.fn().mockResolvedValue([
            { id: "proj-10", title: "AI Medical Platform", slug: "ai-medical" },
          ]),
        },
        projectProvider: {
          findMany: vi.fn().mockResolvedValue([
            { id: "prov-20", displayName: "Elena Vance", email: "elena@vance.dev" },
          ]),
        },
        customProjectRequest: {
          findMany: vi.fn().mockResolvedValue([
            { id: "req-30", projectTitle: "Custom FinTech Ledger" },
          ]),
        },
        inquiry: { findMany: vi.fn().mockResolvedValue([]) },
        transaction: { findMany: vi.fn().mockResolvedValue([]) },
        supportTicket: { findMany: vi.fn().mockResolvedValue([]) },
      };

      const rawLogs: RawAuditLogRow[] = [
        {
          id: "log-1",
          userId: "admin-1",
          action: "PROJECT_MODERATED",
          entityType: "Project",
          entityId: "proj-10",
          details: { status: "PUBLISHED", secret: "must-be-redacted" },
          createdAt: new Date("2026-06-01T10:00:00Z"),
        },
        {
          id: "log-2",
          userId: null,
          action: "CUSTOM_REQUEST_RECEIVED",
          entityType: "CustomProjectRequest",
          entityId: "req-30",
          details: null,
          createdAt: new Date("2026-06-01T11:00:00Z"),
        },
        {
          id: "log-3",
          userId: "deleted-admin-999",
          action: "PARTNER_ACTIVATED",
          entityType: "ProjectProvider",
          entityId: "prov-20",
          details: null,
          createdAt: new Date("2026-06-01T12:00:00Z"),
        },
        {
          id: "log-4",
          userId: "admin-1",
          action: "USER_ROLE_UPDATED",
          entityType: "User",
          entityId: "target-user-1",
          details: null,
          createdAt: new Date("2026-06-01T13:00:00Z"),
        },
      ];

      const resolved = await resolveAuditLogRows(rawLogs, mockClient as any);

      // Verify batching: each table queried at most ONCE regardless of row count
      expect(mockClient.user.findMany).toHaveBeenCalledTimes(1);
      expect(mockClient.project.findMany).toHaveBeenCalledTimes(1);
      expect(mockClient.projectProvider.findMany).toHaveBeenCalledTimes(1);
      expect(mockClient.customProjectRequest.findMany).toHaveBeenCalledTimes(1);

      // Row 1: Resolved admin + Project title + admin link + redacted details
      expect(resolved[0].actor).toMatchObject({
        status: "resolved",
        name: "Varun Admin",
        email: "varun@admin.dev",
      });
      expect(resolved[0].entity).toEqual({
        entityType: "Project",
        entityId: "proj-10",
        label: "AI Medical Platform",
        href: "/admin/projects/proj-10/edit",
      });
      expect((resolved[0].details as any).secret).toBe("[REDACTED]");

      // Row 2: System actor + CustomProjectRequest title + link
      expect(resolved[1].actor.status).toBe("system");
      expect(resolved[1].actor.displayLabel).toBe("System");
      expect(resolved[1].entity).toEqual({
        entityType: "CustomProjectRequest",
        entityId: "req-30",
        label: "Custom FinTech Ledger",
        href: "/admin/custom-requests/req-30",
      });

      // Row 3: Deleted user actor + ProjectProvider displayName + link
      expect(resolved[2].actor.status).toBe("deleted");
      expect(resolved[2].actor.displayLabel).toBe("Deleted user");
      expect(resolved[2].entity).toEqual({
        entityType: "ProjectProvider",
        entityId: "prov-20",
        label: "Elena Vance",
        href: "/admin/providers/prov-20/edit",
      });

      // Row 4: User entity -> resolves to email
      expect(resolved[3].entity.label).toBe("jane@customer.dev");
    });
  });

  describe("5. CSV Escaping & Formula Injection Protection", () => {
    it("prefixes cells starting with =, +, -, or @ with a single quote and escapes double quotes", () => {
      expect(escapeCsvCell("=cmd|' /C calc'!A0")).toBe(`"'=cmd|' /C calc'!A0"`);
      expect(escapeCsvCell("+SUM(A1:A10)")).toBe(`"'+SUM(A1:A10)"`);
      expect(escapeCsvCell("-2+3+cmd")).toBe(`"'-2+3+cmd"`);
      expect(escapeCsvCell("@IMPORTXML()")).toBe(`"'@IMPORTXML()"`);
      expect(escapeCsvCell('Safe "Quoted" Title')).toBe(`"Safe ""Quoted"" Title"`);
    });

    it("formats enriched audit rows into CSV with headers and redacted payloads", async () => {
      const rows = await resolveAuditLogRows(
        [
          {
            id: "csv-1",
            userId: null,
            action: "PROVIDER_REMOVED",
            entityType: "ProjectProvider",
            entityId: "prov-1",
            details: { reason: "=malicious_formula()", token: "secret-tok" },
            createdAt: new Date("2026-06-15T10:00:00.000Z"),
          },
        ],
        {
          user: { findMany: vi.fn().mockResolvedValue([]) },
          project: { findMany: vi.fn().mockResolvedValue([]) },
          projectProvider: {
            findMany: vi.fn().mockResolvedValue([
              { id: "prov-1", displayName: "=EvilProvider", email: "e@e.com" },
            ]),
          },
          customProjectRequest: { findMany: vi.fn().mockResolvedValue([]) },
          inquiry: { findMany: vi.fn().mockResolvedValue([]) },
          transaction: { findMany: vi.fn().mockResolvedValue([]) },
          supportTicket: { findMany: vi.fn().mockResolvedValue([]) },
        } as any
      );

      const csv = formatAuditLogsAsCsv(rows);
      expect(csv).toContain(`"ID","Timestamp (UTC)","Action"`);
      // "=EvilProvider" is prefixed with single quote
      expect(csv).toContain(`"'=EvilProvider"`);
      // Token inside JSON is redacted
      expect(csv).toContain(`[REDACTED]`);
      expect(csv).not.toContain(`secret-tok`);
    });
  });

  describe("6. End-to-End Mock Query, Search & Immutability", () => {
    it("writes audit log with redacted payload and searchText, and matches via getAdminAuditLogs search", async () => {
      await createAuditLog({
        userId: "user-admin",
        action: "PROJECT_MODERATED",
        entityType: "Project",
        entityId: "proj-1",
        details: {
          moderationNote: "Verified architecture diagrams",
          passwordHash: "should-never-be-stored",
        },
      });

      const res = await getAdminAuditLogs({
        q: "architecture diagrams",
        action: "PROJECT_MODERATED",
      });

      expect(res.total).toBeGreaterThanOrEqual(1);
      const matched = res.logs.find((l) => l.action === "PROJECT_MODERATED");
      expect(matched).toBeDefined();
      expect((matched!.details as any).passwordHash).toBe("[REDACTED]");
      expect(matched!.entity.label).toBe("SmartDoc AI Medical Analysis Platform");
    });

    it("enforces audit log immutability (blocks update and delete on auditLog)", async () => {
      await expect(
        (db.auditLog as any).update({
          where: { id: "audit-seed-1" },
          data: { action: "TAMPERED" },
        })
      ).rejects.toThrow(/immutable/i);

      await expect(
        (db.auditLog as any).delete({
          where: { id: "audit-seed-1" },
        })
      ).rejects.toThrow(/immutable/i);
    });

    it("aborts test run if a real DATABASE_URL is present in environment", () => {
      expect(() =>
        assertTestDbIsolation({
          USE_MOCK_DB: "true",
          DATABASE_URL: "postgresql://neondb_owner:realpass@ep-cool-cloud.aws.neon.tech/neondb",
        })
      ).toThrow(/Aborting test run: a real DATABASE_URL is present/);

      expect(() =>
        assertTestDbIsolation({
          USE_MOCK_DB: "true",
          DATABASE_URL: "",
        })
      ).not.toThrow();
    });
  });
});
