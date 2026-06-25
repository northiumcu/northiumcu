import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveMemberRecoveryByEmail } from "@/lib/auth/resolve-member-recovery";
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
    const target = await resolveMemberRecoveryByEmail(admin, parsed.data.email);

    if (target) {
      const messageId = await sendUsernameRecoveryEmail({
        to: target.email,
        firstName: target.firstName,
        username: target.username,
      });
      console.info("[Northium Recovery] Username reminder sent.", {
        messageId: messageId ?? "unknown",
      });
    } else {
      console.info(
        "[Northium Recovery] No deliverable member account matched the requested email."
      );
    }

    return NextResponse.json({ message: SUCCESS_MESSAGE });
  } catch (error) {
    if (error instanceof EmailDeliveryError) {
      console.error("[Northium Recovery] Email delivery failed:", error.message);
      return NextResponse.json(
        {
          error:
            "We could not send the recovery email right now. Please try again shortly or contact your account officer.",
        },
        { status: 503 }
      );
    }
    const message = error instanceof Error ? error.message : "Request failed.";
    console.error("[Northium Recovery] Request failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
