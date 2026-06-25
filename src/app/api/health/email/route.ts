import { NextResponse } from "next/server";
import { emailDeliveryStatus } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/** Read-only ops check — does not expose secrets or send mail. */
export async function GET() {
  try {
    const status = await emailDeliveryStatus();
    const admin = createAdminClient();
    const { data } = await admin
      .from("institution_settings")
      .select("value, updated_at")
      .eq("key", "email_delivery")
      .maybeSingle();

    const stored = data?.value as
      | { from_email?: string; has_api_key?: boolean }
      | undefined;

    return NextResponse.json({
      configured: status.configured,
      source: status.source,
      from: status.from,
      defaultFromEmail: status.defaultFromEmail,
      envVarPresent: status.envVarPresent,
      resend: status.resend,
      databaseConfigured: Boolean(stored?.has_api_key),
      storedFromEmail: stored?.from_email ?? null,
      updatedAt: data?.updated_at ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Health check failed.";
    return NextResponse.json({ configured: false, error: message }, { status: 500 });
  }
}
