#!/usr/bin/env node
/**
 * Verifies activity email wiring + production Resend configuration.
 * Run: node scripts/verify-email-delivery.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

loadEnvFile(".env.production.check");
loadEnvFile(".env.local");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const productionUrl = process.env.PRODUCTION_URL ?? "https://northiumcu.com";

const codeChecks = [
  { name: "Transfer emails awaited", file: "src/lib/banking/execute-transfer.ts", pattern: "await sendTransferStatusEmail" },
  { name: "Transaction emails awaited", file: "src/lib/banking/post-transaction.ts", pattern: "await notifyPostedTransaction" },
  { name: "Card emails awaited", file: "src/app/api/admin/cards/[id]/route.ts", pattern: "await sendMemberEmail" },
  { name: "Account status emails awaited", file: "src/app/api/admin/members/[id]/status/route.ts", pattern: "await sendAccountStatusEmail" },
  { name: "Generated txs skip email", file: "src/lib/banking/generate-member-transactions.ts", pattern: "skipMemberEmail: true" },
];

console.log("=== Code wiring ===\n");
for (const check of codeChecks) {
  const content = readFileSync(check.file, "utf8");
  const ok = content.includes(check.pattern);
  console.log(`${ok ? "✓" : "✗"} ${check.name}`);
}

console.log("\n=== Production health endpoint ===\n");
let health = null;
try {
  const res = await fetch(`${productionUrl}/api/health/email`, {
    headers: { Accept: "application/json" },
  });
  health = await res.json();
  console.log(JSON.stringify(health, null, 2));
} catch (error) {
  console.error("Failed to reach production health endpoint:", error.message);
}

console.log("\n=== Supabase member emails ===\n");
if (url && key) {
  const admin = createClient(url, key);
  const { data: members, error } = await admin
    .from("profiles")
    .select("id, email, first_name, member_status")
    .eq("staff_role", "member")
    .eq("member_status", "active")
    .limit(5);

  if (error) {
    console.error("Member query failed:", error.message);
  } else {
    const withEmail = (members ?? []).filter((m) => m.email?.includes("@"));
    console.log(`Active members sampled: ${members?.length ?? 0}`);
    console.log(`With deliverable email: ${withEmail.length}`);
    for (const member of withEmail) {
      console.log(`  - ${member.first_name ?? "Member"} <${member.email}>`);
    }
  }

  const { data: settings } = await admin
    .from("institution_settings")
    .select("value")
    .eq("key", "email_delivery")
    .maybeSingle();
  console.log(
    `\nDatabase email_delivery fallback: ${settings?.value?.has_api_key ? "yes" : "no"}`
  );
} else {
  console.log("Skipped (missing Supabase env).");
}

console.log("\n=== Summary ===\n");
if (health?.configured) {
  console.log("✓ Production reports Resend is configured.");
  console.log(`  Source: ${health.source}, From: ${health.from}`);
} else {
  console.log("✗ Production reports Resend is NOT configured.");
  console.log("  Set RESEND_API_KEY + RESEND_FROM_EMAIL on Vercel or Admin → Settings → Email delivery.");
}

console.log("\nActivity emails sent for:");
console.log("  • Transfers (completed, pending, approved, declined, delayed)");
console.log("  • Credits / debits (not generated history or outbound transfer debits)");
console.log("  • Card approved / declined");
console.log("  • Account paused / suspended / restored");
console.log("\nNot emailed (by design):");
console.log("  • Admin-generated transactions");
console.log("  • Transfer / bill pay pause blocks");
console.log("  • Loan applications (portal notification only)");
