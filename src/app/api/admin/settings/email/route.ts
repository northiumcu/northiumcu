import { NextResponse } from "next/server";
import { z } from "zod";
import { encryptSensitive } from "@/lib/auth/crypto";
import { requireStaff } from "@/lib/auth/require-staff";
import { EmailDeliveryError } from "@/lib/email/config";
import { getDefaultResendFromEmail } from "@/lib/email/resolve-credentials";
import { emailDeliveryStatus, sendResendEmail } from "@/lib/email/resend";
import { buildOtpSignupEmail } from "@/lib/email/templates/catalog";
import { generateOtpCode } from "@/lib/auth/crypto";

const saveSchema = z.object({
  apiKey: z.string().trim().min(10).max(200).optional(),
  fromEmail: z.string().email().optional(),
  testEmail: z.string().email().optional(),
});

export async function GET() {
  try {
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;

    const status = await emailDeliveryStatus();
    const { data } = await auth.admin
      .from("institution_settings")
      .select("value, updated_at")
      .eq("key", "email_delivery")
      .maybeSingle();

    const stored = data?.value as { from_email?: string; has_api_key?: boolean } | undefined;

    return NextResponse.json({
      ...status,
      databaseConfigured: Boolean(stored?.has_api_key),
      storedFromEmail: stored?.from_email ?? null,
      updatedAt: data?.updated_at ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;

    const body = await request.json();
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email settings." }, { status: 400 });
    }

    const { apiKey, fromEmail, testEmail } = parsed.data;

    if (!apiKey && !fromEmail && !testEmail) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const { data: existing } = await auth.admin
      .from("institution_settings")
      .select("value")
      .eq("key", "email_delivery")
      .maybeSingle();

    const current = (existing?.value ?? {}) as {
      api_key_encrypted?: string;
      from_email?: string;
      has_api_key?: boolean;
    };

    const nextValue = {
      ...current,
      ...(apiKey
        ? {
            api_key_encrypted: encryptSensitive(apiKey),
            has_api_key: true,
          }
        : {}),
      ...(fromEmail ? { from_email: fromEmail } : {}),
    };

    if (apiKey || fromEmail) {
      const { error } = await auth.admin.from("institution_settings").upsert(
        {
          key: "email_delivery",
          value: nextValue,
          updated_by: auth.user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    if (testEmail) {
      const code = generateOtpCode();
      const message = buildOtpSignupEmail(code, {
        firstName: "Jordan",
        username: "jordan.lee",
      });
      await sendResendEmail({
        to: testEmail,
        subject: `[Test] ${message.subject}`,
        text: message.text,
        html: message.html,
      });
    }

    const status = await emailDeliveryStatus();
    return NextResponse.json({
      message: testEmail
        ? `Test email sent to ${testEmail}.`
        : "Email delivery settings saved.",
      ...status,
    });
  } catch (error) {
    if (error instanceof EmailDeliveryError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : "Save failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;

    const body = await request.json().catch(() => ({}));
    const testEmail =
      typeof body.testEmail === "string" && body.testEmail.includes("@")
        ? body.testEmail
        : auth.profile.email;

    const code = generateOtpCode();
    const message = buildOtpSignupEmail(code, {
      firstName: "Jordan",
      username: "jordan.lee",
    });

    await sendResendEmail({
      to: testEmail,
      subject: `[Test] ${message.subject}`,
      text: message.text,
      html: message.html,
    });

    return NextResponse.json({
      message: `Test email sent to ${testEmail}.`,
      from: getDefaultResendFromEmail(),
    });
  } catch (error) {
    if (error instanceof EmailDeliveryError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }
    const message = error instanceof Error ? error.message : "Test failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
