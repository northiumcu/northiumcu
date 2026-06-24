#!/usr/bin/env node
/**
 * Creates or updates the Northium super-admin account.
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, AUTH_ENCRYPTION_KEY
 */
import { createClient } from "@supabase/supabase-js";
import {
  createCipheriv,
  randomBytes,
  randomInt,
  scryptSync,
} from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ADMIN = {
  username: "northium.admin",
  email: "northiumcc@gmail.com",
  firstName: "Northium",
  lastName: "Administrator",
  staffRole: "super_administrator",
};

function generatePin() {
  return String(randomInt(100000, 1000000));
}

function getEncryptionKey() {
  const raw = process.env.AUTH_ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    console.error("AUTH_ENCRYPTION_KEY must be set (32+ chars).");
    process.exit(1);
  }
  return scryptSync(raw, "northium-auth", 32);
}

function encryptSensitive(value) {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function hashPin(pin) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function upsertAdmin({ username, email, pin, firstName, lastName, staffRole }) {
  const internalSecret = randomBytes(32).toString("hex");
  const { data: existingByEmail } = await admin
    .from("profiles")
    .select("id, username")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  const { data: existingByUsername } = await admin
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle();

  const existingId = existingByEmail?.id ?? existingByUsername?.id;

  if (existingId) {
    await admin.auth.admin.updateUserById(existingId, {
      email,
      password: internalSecret,
      email_confirm: true,
    });
    await admin
      .from("profiles")
      .update({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        pin_hash: hashPin(pin),
        internal_auth_secret: encryptSensitive(internalSecret),
        staff_role: staffRole,
        email_verified_at: new Date().toISOString(),
        first_name: firstName,
        last_name: lastName,
        member_status: "active",
      })
      .eq("id", existingId);
    return { id: existingId, updated: true };
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: internalSecret,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName, username },
  });

  if (error || !created.user) {
    throw new Error(error?.message ?? "Failed to create admin user.");
  }

  await admin
    .from("profiles")
    .update({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      pin_hash: hashPin(pin),
      internal_auth_secret: encryptSensitive(internalSecret),
      staff_role: staffRole,
      email_verified_at: new Date().toISOString(),
      first_name: firstName,
      last_name: lastName,
      member_status: "active",
    })
    .eq("id", created.user.id);

  return { id: created.user.id, updated: false };
}

try {
  const pin = generatePin();
  const result = await upsertAdmin({ ...ADMIN, pin });

  console.log("Northium admin account ready:\n");
  console.log(`  Sign-in URL:  https://northiumcu.com/sign-in`);
  console.log(`  Username:     ${ADMIN.username}`);
  console.log(`  Email:        ${ADMIN.email}`);
  console.log(`  Account PIN:  ${pin}`);
  console.log(`  Role:         ${ADMIN.staffRole}`);
  console.log(`  Status:       ${result.updated ? "updated" : "created"}`);
  console.log("\nSign in with username + 6-digit PIN. Change your PIN after first login.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
