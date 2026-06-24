#!/usr/bin/env node
/**
 * Validates Phase 5 database migration artifacts without requiring a live database.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const migrationsDir = join(root, "supabase", "migrations");

const REQUIRED_TABLES = [
  "profiles",
  "roles",
  "permissions",
  "role_permissions",
  "profile_roles",
  "membership_applications",
  "application_status_history",
  "accounts",
  "transactions",
  "transfers",
  "cards",
  "loans",
  "audit_logs",
  "notifications",
  "notification_preferences",
  "domain_events",
  "institution_settings",
];

const REQUIRED_FUNCTIONS = [
  "is_admin",
  "is_staff",
  "owns_account",
  "prevent_audit_mutation",
  "handle_new_user",
  "protect_profile_privileged_columns",
];

function fail(message) {
  process.stderr.write(`FAIL: ${message}\n`);
  process.exit(1);
}

function ok(message) {
  process.stdout.write(`OK: ${message}\n`);
}

const files = readdirSync(migrationsDir).filter((f) => f.endsWith(".sql"));
if (files.length === 0) {
  fail("No migration files found in supabase/migrations");
}

const sql = files
  .map((file) => readFileSync(join(migrationsDir, file), "utf8"))
  .join("\n");

for (const table of REQUIRED_TABLES) {
  if (!sql.includes(`CREATE TABLE IF NOT EXISTS public.${table}`)) {
    fail(`Missing table definition: ${table}`);
  }
  if (!sql.includes(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`)) {
    fail(`RLS not enabled on table: ${table}`);
  }
}

for (const fn of REQUIRED_FUNCTIONS) {
  if (!sql.includes(`public.${fn}`)) {
    fail(`Missing function: ${fn}`);
  }
}

if (!sql.includes("REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon")) {
  fail("Anonymous access not revoked");
}

if (!sql.includes("audit_logs are append-only")) {
  fail("Audit immutability trigger missing");
}

if (!sql.includes("helpdesk@northiumcu.com")) {
  fail("Institution identity seed missing from institution_settings");
}

if (!sql.includes("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES")) {
  fail("Explicit table grants missing");
}

ok(`Validated ${files.length} migration file(s)`);
ok(`All ${REQUIRED_TABLES.length} core tables present with RLS`);
ok("Security functions and audit immutability confirmed");
process.exit(0);
