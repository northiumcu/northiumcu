import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOtpCode, hashOtp } from "@/lib/auth/crypto";
import { signupResendSchema } from "@/lib/auth/validators";
import { sendOtpEmail } from "@/lib/email/send-otp";
import { EmailDeliveryError } from "@/lib/email/config";
import {
  SIGNUP_RESEND_COOLDOWN_MS,
  invalidateSignupChallenges,
  maskEmail,
  pendingSignupExpiresAt,
  resolveSignupStatus,
  signupOtpExpiresAt,
} from "@/lib/auth/signup-session";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const limited = enforceRateLimit(request, "auth:signup-resend-otp", 8, 60_000);
    if (limited) return limited;

    const body = await request.json();
    const parsed = signupResendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const admin = createAdminClient();
    const email = parsed.data.email.toLowerCase().trim();
    const status = await resolveSignupStatus(admin, email);

    if (status.stage === "registered_complete") {
      return NextResponse.json(
        { error: "This email is already registered. Sign in to continue." },
        { status: 409 }
      );
    }

    if (status.stage === "registered_incomplete") {
      return NextResponse.json(
        {
          error:
            "Your account is already created. Sign in with your username and PIN to finish membership.",
          stage: status.stage,
        },
        { status: 409 }
      );
    }

    const { data: pending } = await admin
      .from("pending_signups")
      .select("email, username, first_name")
      .eq("email", email)
      .maybeSingle();

    if (!pending) {
      return NextResponse.json(
        {
          error:
            "No application found for this email. Start a new membership application first.",
        },
        { status: 404 }
      );
    }

    const { data: recentChallenge } = await admin
      .from("auth_otp_challenges")
      .select("created_at")
      .eq("email", email)
      .eq("purpose", "signup")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      recentChallenge?.created_at &&
      Date.now() - new Date(recentChallenge.created_at).getTime() < SIGNUP_RESEND_COOLDOWN_MS
    ) {
      return NextResponse.json(
        { error: "Please wait a moment before requesting another code." },
        { status: 429 }
      );
    }

    await admin
      .from("pending_signups")
      .update({ expires_at: pendingSignupExpiresAt() })
      .eq("email", email);

    await invalidateSignupChallenges(admin, email);

    const otp = generateOtpCode();
    const { data: challenge, error: otpError } = await admin
      .from("auth_otp_challenges")
      .insert({
        email,
        purpose: "signup",
        code_hash: hashOtp(otp),
        expires_at: signupOtpExpiresAt(),
        metadata: { username: pending.username },
      })
      .select("id")
      .single();

    if (otpError || !challenge) {
      return NextResponse.json({ error: otpError?.message }, { status: 500 });
    }

    try {
      await sendOtpEmail({
        to: email,
        code: otp,
        purpose: "signup",
      });
    } catch (emailError) {
      await admin.from("auth_otp_challenges").delete().eq("id", challenge.id);
      throw emailError;
    }

    return NextResponse.json({
      challengeId: challenge.id,
      email,
      maskedEmail: maskEmail(email),
      firstName: pending.first_name,
      message: "A new verification code was sent to your email.",
    });
  } catch (error) {
    if (error instanceof EmailDeliveryError) {
      return NextResponse.json(
        {
          error:
            "We could not send your verification email. Please try again shortly or contact helpdesk@northiumcu.com.",
        },
        { status: 503 }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to resend code.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
