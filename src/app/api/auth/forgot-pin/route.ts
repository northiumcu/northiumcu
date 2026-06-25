import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOtpCode, hashOtp } from "@/lib/auth/crypto";
import { forgotPinSchema } from "@/lib/auth/validators";
import { EmailDeliveryError } from "@/lib/email/config";
import { sendOtpEmail } from "@/lib/email/send-otp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPinSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      return NextResponse.json(
        { error: firstError ?? "Enter a valid username." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const normalizedUsername = parsed.data.username.trim().toLowerCase();

    const { data: profile } = await admin
      .from("profiles")
      .select("id, email, staff_role, member_status")
      .ilike("username", normalizedUsername)
      .single();

    if (
      !profile ||
      profile.staff_role !== "member" ||
      profile.member_status === "suspended"
    ) {
      return NextResponse.json(
        { error: "We could not find an active member account with that username." },
        { status: 404 }
      );
    }

    const otp = generateOtpCode();
    const { data: challenge, error: otpError } = await admin
      .from("auth_otp_challenges")
      .insert({
        profile_id: profile.id,
        email: profile.email,
        purpose: "pin_reset",
        code_hash: hashOtp(otp),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        metadata: { username: normalizedUsername },
      })
      .select("id")
      .single();

    if (otpError || !challenge) {
      return NextResponse.json({ error: otpError?.message }, { status: 500 });
    }

    await sendOtpEmail({
      to: profile.email,
      code: otp,
      purpose: "pin_reset",
    });

    return NextResponse.json({
      challengeId: challenge.id,
      email: profile.email,
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    if (error instanceof EmailDeliveryError) {
      return NextResponse.json(
        {
          error:
            "We could not send the verification email right now. Please try again shortly or contact your account officer.",
        },
        { status: 503 }
      );
    }
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
