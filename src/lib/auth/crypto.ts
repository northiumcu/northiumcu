import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALGO = "aes-256-gcm";

let cachedEncryptionKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (cachedEncryptionKey) return cachedEncryptionKey;

  const raw = process.env.AUTH_ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_ENCRYPTION_KEY must be set in production (32+ chars).");
    }
    cachedEncryptionKey = scryptSync("northium-dev-only-key", "northium-salt", 32);
    return cachedEncryptionKey;
  }
  cachedEncryptionKey = scryptSync(raw, "northium-auth", 32);
  return cachedEncryptionKey;
}

export function encryptSensitive(value: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSensitive(payload: string): string {
  const key = getEncryptionKey();
  const data = Buffer.from(payload, "base64");
  const iv = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

export function hashPin(pin: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(pin, salt, 64).toString("hex");
  return candidate === hash;
}

export function hashOtp(code: string): string {
  const normalized = code.replace(/\D/g, "").trim();
  const salt = randomBytes(8).toString("hex");
  const hash = scryptSync(normalized, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyOtp(code: string, stored: string): boolean {
  const normalized = code.replace(/\D/g, "").trim();
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(normalized, salt, 32).toString("hex");
  return candidate === hash;
}

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateInternalAuthSecret(): string {
  return randomBytes(32).toString("hex");
}

export function lastFour(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.slice(-4);
}
