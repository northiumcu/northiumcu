import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { forgotUsernameSchema } from "@/lib/auth/validators";
import { EmailDeliveryError } from "@/lib/email/config";
import { sendUsernameRecoveryEmail } from "@/lib/email/send-username-recovery";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const SUCCESS_MESSAGE =
  "If an account exists for that email, we sent your username and sign-in instructions.";

export async function POST(request: Request) {
  try {
    const limited = enforceRateLimit(request, "auth:forgot-username", 8, 60_000);
    if (limited) return limited;

    const body = await request.json();
    const parsed = forgotUsernameSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      return NextResponse.json(
        { error: firstError ?? "Enter a valid email address." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const normalizedEmail = parsed.data.email.toLowerCase().trim();

    const { data: profile } = await admin
      .from("profiles")
      .select("email, first_name, username, staff_role, member_status")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (
      profile &&
      profile.staff_role === "member" &&
      profile.member_status !== "suspended" &&
      profile.username?.trim()
    ) {
      try {
        await sendUsernameRecoveryEmail({
          to: profile.email,
          firstName: profile.first_name?.trim() || "Member",
          username: profile.username.trim(),
        });
      } catch (emailError) {
        throw emailError;
      }
    }

    return NextResponse.json({ message: SUCCESS_MESSAGE });
  } catch (error) {
    if (error instanceof EmailDeliveryError) {
      return NextResponse.json(
        {
          error:
            "We could not send the recovery email right now. Please try again shortly or contact your account officer.",
        },
        { status: 503 }
      );
    }
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
