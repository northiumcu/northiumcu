import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSensitive } from "@/lib/auth/crypto";
import { institution } from "@/lib/institution";

export type ResendCredentials = {
  apiKey: string;
  from: string;
  source: "env" | "database";
};

function fromAddress(email: string): string {
  return `${institution.shortName} <${email}>`;
}

/** Production sends from verified domain; sandbox only for explicit testing. */
export function getDefaultResendFromEmail(): string {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (configured) return configured;

  if (process.env.RESEND_USE_SANDBOX === "true") {
    return "onboarding@resend.dev";
  }

  if (process.env.NODE_ENV === "production") {
    return institution.supportEmail;
  }

  return "onboarding@resend.dev";
}

export function getResendFromAddress(fromEmail?: string): string {
  return fromAddress(fromEmail ?? getDefaultResendFromEmail());
}

function readEnvApiKey(): string | undefined {
  return (
    process.env.RESEND_API_KEY?.trim() ||
    process.env.RESEND_KEY?.trim() ||
    process.env.RESEND_SECRET?.trim() ||
    undefined
  );
}

export async function resolveResendCredentials(): Promise<ResendCredentials | null> {
  const envKey = readEnvApiKey();
  if (envKey) {
    return {
      apiKey: envKey,
      from: getResendFromAddress(),
      source: "env",
    };
  }

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("institution_settings")
      .select("value")
      .eq("key", "email_delivery")
      .maybeSingle();

    const record = data?.value as
      | { api_key_encrypted?: string; from_email?: string }
      | undefined;

    if (record?.api_key_encrypted) {
      const apiKey = decryptSensitive(record.api_key_encrypted);
      const fromEmail = record.from_email?.trim() || getDefaultResendFromEmail();
      return {
        apiKey,
        from: getResendFromAddress(fromEmail),
        source: "database",
      };
    }
  } catch (error) {
    console.error("[Northium Email] Failed to load database credentials:", error);
  }

  return null;
}

export async function isEmailDeliveryConfigured(): Promise<boolean> {
  const credentials = await resolveResendCredentials();
  return Boolean(credentials?.apiKey);
}
