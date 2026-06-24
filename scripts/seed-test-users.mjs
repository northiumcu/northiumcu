#!/usr/bin/env node
/**
 * Seeds Northium test admin and member accounts.
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional env overrides:
 *   TEST_ADMIN_USERNAME, TEST_ADMIN_EMAIL, TEST_ADMIN_PIN
 *   TEST_MEMBER_USERNAME, TEST_MEMBER_EMAIL, TEST_MEMBER_PIN
 */
import { createClient } from "@supabase/supabase-js";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
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

const config = {
  admin: {
    username: process.env.TEST_ADMIN_USERNAME ?? "northium.admin",
    email: process.env.TEST_ADMIN_EMAIL ?? "admin@test.northiumcu.com",
    pin: process.env.TEST_ADMIN_PIN ?? "123456",
    firstName: "Northium",
    lastName: "Administrator",
    staffRole: "super_administrator",
  },
  member: {
    username: process.env.TEST_MEMBER_USERNAME ?? "northium.member",
    email: process.env.TEST_MEMBER_EMAIL ?? "member@test.northiumcu.com",
    pin: process.env.TEST_MEMBER_PIN ?? "654321",
    firstName: "Test",
    lastName: "Member",
    staffRole: "member",
  },
};

function getEncryptionKey() {
  const raw = process.env.AUTH_ENCRYPTION_KEY;
  if (raw && raw.length >= 32) {
    return scryptSync(raw, "northium-auth", 32);
  }
  return scryptSync("northium-dev-only-key", "northium-salt", 32);
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

async function upsertUser({
  username,
  email,
  pin,
  firstName,
  lastName,
  staffRole,
}) {
  const internalSecret = randomBytes(32).toString("hex");
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .maybeSingle();

  if (existing?.id) {
    await admin.auth.admin.updateUserById(existing.id, {
      email,
      password: internalSecret,
      email_confirm: true,
    });
    await admin
      .from("profiles")
      .update({
        username: username.toLowerCase(),
        pin_hash: hashPin(pin),
        internal_auth_secret: encryptSensitive(internalSecret),
        staff_role: staffRole,
        email_verified_at: new Date().toISOString(),
        first_name: firstName,
        last_name: lastName,
        member_status: staffRole === "member" ? "applicant" : "active",
      })
      .eq("id", existing.id);
    return { id: existing.id, email, username, pin, updated: true };
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: internalSecret,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName, username },
  });

  if (error || !created.user) {
    throw new Error(error?.message ?? `Failed to create ${username}`);
  }

  await admin
    .from("profiles")
    .update({
      username: username.toLowerCase(),
      pin_hash: hashPin(pin),
      internal_auth_secret: encryptSensitive(internalSecret),
      staff_role: staffRole,
      email_verified_at: new Date().toISOString(),
      first_name: firstName,
      last_name: lastName,
      member_status: staffRole === "member" ? "applicant" : "active",
    })
    .eq("id", created.user.id);

  return { id: created.user.id, email, username, pin, updated: false };
}

try {
  const adminUser = await upsertUser(config.admin);
  const memberUser = await upsertUser(config.member);

  console.log("Northium test users ready:\n");
  console.log("ADMIN");
  console.log(`  Username: ${adminUser.username}`);
  console.log(`  Email:    ${adminUser.email}`);
  console.log(`  PIN:      ${adminUser.pin}`);
  console.log("");
  console.log("MEMBER (KYC pending until admin approves in /admin/members)");
  console.log(`  Username: ${memberUser.username}`);
  console.log(`  Email:    ${memberUser.email}`);
  console.log(`  PIN:      ${memberUser.pin}`);
  console.log("");
  console.log("OTP codes print to server console when RESEND_API_KEY is unset.");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
