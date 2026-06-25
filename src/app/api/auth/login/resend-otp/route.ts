import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOtpCode, hashOtp } from "@/lib/auth/crypto";
import { sendOtpEmail } from "@/lib/email/send-otp";
import { EmailDeliveryError } from "@/lib/email/config";
import { maskEmail, SIGNUP_RESEND_COOLDOWN_MS } from "@/lib/auth/signup-session";
import { enforceRateLimit } from "@/lib/security/rate-limit";

const loginResendSchema = z.object({
  challengeId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const limited = enforceRateLimit(request, "auth:login-resend-otp", 8, 60_000);
    if (limited) return limited;

    const body = await request.json();
    const parsed = loginResendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid resend request." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: challenge } = await admin
      .from("auth_otp_challenges")
      .select("id, email, purpose, profile_id, metadata, consumed_at")
      .eq("id", parsed.data.challengeId)
      .single();

    if (!challenge || challenge.consumed_at) {
      return NextResponse.json(
        { error: "Sign-in session expired. Please sign in again." },
        { status: 400 }
      );
    }

    if (challenge.purpose !== "login") {
      return NextResponse.json({ error: "Invalid resend request." }, { status: 400 });
    }

    const { data: recentChallenge } = await admin
      .from("auth_otp_challenges")
      .select("created_at")
      .eq("email", challenge.email)
      .eq("purpose", "login")
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

    const now = new Date().toISOString();
    await admin
      .from("auth_otp_challenges")
      .update({ consumed_at: now })
      .eq("email", challenge.email)
      .eq("purpose", "login")
      .is("consumed_at", null);

    const otp = generateOtpCode();
    const { data: newChallenge, error: otpError } = await admin
      .from("auth_otp_challenges")
      .insert({
        profile_id: challenge.profile_id,
        email: challenge.email,
        purpose: "login",
        code_hash: hashOtp(otp),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        metadata: challenge.metadata,
      })
      .select("id")
      .single();

    if (otpError || !newChallenge) {
      return NextResponse.json({ error: otpError?.message }, { status: 500 });
    }

    try {
      await sendOtpEmail({
        to: challenge.email,
        code: otp,
        purpose: "login",
      });
    } catch (emailError) {
      await admin.from("auth_otp_challenges").delete().eq("id", newChallenge.id);
      throw emailError;
    }

    return NextResponse.json({
      challengeId: newChallenge.id,
      email: maskEmail(challenge.email),
      message: "A new verification code was sent to your email.",
    });
  } catch (error) {
    if (error instanceof EmailDeliveryError) {
      return NextResponse.json(
        {
          error:
            "We could not send your verification email. Please try again shortly.",
        },
        { status: 503 }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to resend code.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
