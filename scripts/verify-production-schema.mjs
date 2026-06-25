#!/usr/bin/env node
/**
 * Verifies production Supabase has required schema for member controls + bill pay.
 * Run: node scripts/verify-production-schema.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, key);

const checks = [
  {
    name: "profiles.bill_pay_enabled",
    run: () =>
      admin.from("profiles").select("bill_pay_enabled").limit(1),
  },
  {
    name: "bill_pay_payees table",
    run: () => admin.from("bill_pay_payees").select("id").limit(1),
  },
  {
    name: "cards.pan_encrypted",
    run: () => admin.from("cards").select("pan_encrypted").limit(1),
  },
  {
    name: "transfers.payee_id",
    run: () => admin.from("transfers").select("payee_id").limit(1),
  },
  {
    name: "profiles.pause_transfers",
    run: () => admin.from("profiles").select("pause_transfers, transfer_pause_reason").limit(1),
  },
  {
    name: "transactions.ledger_direction",
    run: () => admin.from("transactions").select("ledger_direction").limit(1),
  },
  {
    name: "post_account_transaction RPC",
    run: () => admin.rpc("post_account_transaction", {
      p_account_id: "00000000-0000-0000-0000-000000000000",
      p_amount: 1,
      p_direction: "credit",
      p_type: "deposit",
      p_description: "schema probe",
    }),
    expectError: true,
  },
];

let failed = false;

for (const check of checks) {
  const { error } = await check.run();
  if (error) {
    const ok = check.expectError && error.message.includes("Account not found");
    if (ok) {
      console.log(`OK    ${check.name}`);
      continue;
    }
    console.error(`FAIL  ${check.name}: ${error.message}`);
    failed = true;
  } else {
    if (check.expectError) {
      console.error(`FAIL  ${check.name}: expected RPC error probe`);
      failed = true;
    } else {
      console.log(`OK    ${check.name}`);
    }
  }
}

if (failed) {
  console.error("\nRun: supabase db push");
  process.exit(1);
}

console.log("\nProduction schema looks good.");
