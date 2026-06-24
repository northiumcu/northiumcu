import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { buildAuditRecord } from "../../src/lib/database/audit.ts";
import {
  ACCOUNT_STATUSES,
  MEMBER_STATUSES,
  TABLE_NAMES,
} from "../../src/lib/database/enums.ts";

const migrationsDir = join(process.cwd(), "supabase", "migrations");

describe("Phase 5 database foundation", () => {
  it("includes a foundation migration file", () => {
    const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
    assert.ok(files.some((f) => f.includes("database_foundation")));
  });

  it("defines all core table names in application enums", () => {
    assert.equal(TABLE_NAMES.profiles, "profiles");
    assert.equal(TABLE_NAMES.auditLogs, "audit_logs");
    assert.equal(TABLE_NAMES.domainEvents, "domain_events");
  });

  it("aligns member lifecycle with blueprint", () => {
    assert.ok(MEMBER_STATUSES.includes("verified"));
    assert.ok(MEMBER_STATUSES.includes("dormant"));
    assert.ok(ACCOUNT_STATUSES.includes("restricted"));
  });

  it("builds audit records with required fields", () => {
    const record = buildAuditRecord({
      actorId: "00000000-0000-0000-0000-000000000001",
      actorRole: "member",
      action: "account.opened",
      resourceType: "account",
      resourceId: "00000000-0000-0000-0000-000000000002",
      channel: "api",
    });

    assert.equal(record.action, "account.opened");
    assert.equal(record.resource_type, "account");
    assert.equal(record.channel, "api");
    assert.deepEqual(record.metadata, {});
  });

  it("migration SQL enables RLS on audit_logs", () => {
    const sql = readFileSync(
      join(migrationsDir, "001_database_foundation.sql"),
      "utf8"
    );
    assert.match(
      sql,
      /ALTER TABLE public\.audit_logs ENABLE ROW LEVEL SECURITY/
    );
    assert.match(sql, /prevent_audit_mutation/);
  });
});
