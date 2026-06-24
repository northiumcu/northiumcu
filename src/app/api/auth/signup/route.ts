import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  encryptSensitive,
  generateInternalAuthSecret,
  generateOtpCode,
  hashOtp,
  hashPin,
} from "@/lib/auth/crypto";
import { accountTypesWithSavings } from "@/lib/auth/membership-options";
import { signupSchema } from "@/lib/auth/validators";
import { sendOtpEmail } from "@/lib/email/send-otp";
import { verifyMathChallenge } from "@/lib/security/human-check";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      return NextResponse.json(
        { error: firstError ?? "Invalid application." },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (!verifyMathChallenge(data.humanCheckToken, data.humanCheckAnswer)) {
      return NextResponse.json(
        { error: "Incorrect verification answer. Please try again." },
        { status: 400 }
      );
    }
    const admin = createAdminClient();
    const normalizedUsername = data.username.toLowerCase();
    const normalizedEmail = data.email.toLowerCase().trim();

    const [{ data: existingUser }, { data: existingUsername }] =
      await Promise.all([
        admin.from("profiles").select("id").eq("email", normalizedEmail).maybeSingle(),
        admin
          .from("profiles")
          .select("id")
          .ilike("username", normalizedUsername)
          .maybeSingle(),
      ]);

    if (existingUser || existingUsername) {
      return NextResponse.json(
        { error: "Username or email is already registered." },
        { status: 409 }
      );
    }

    const internalSecret = generateInternalAuthSecret();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: pendingError } = await admin.from("pending_signups").upsert(
      {
        email: normalizedEmail,
        username: normalizedUsername,
        first_name: data.firstName.trim(),
        last_name: data.lastName.trim(),
        phone: data.phone?.trim() ?? null,
        pin_hash: hashPin(data.pin),
        internal_auth_secret: encryptSensitive(internalSecret),
        eligibility_category: data.eligibilityCategory,
        requested_account_types: accountTypesWithSavings(
          data.requestedAccountType
        ),
        expires_at: expiresAt,
      },
      { onConflict: "email" }
    );

    if (pendingError) {
      return NextResponse.json({ error: pendingError.message }, { status: 500 });
    }

    const otp = generateOtpCode();
    const { data: challenge, error: otpError } = await admin
      .from("auth_otp_challenges")
      .insert({
        email: normalizedEmail,
        purpose: "signup",
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
      to: normalizedEmail,
      code: otp,
      purpose: "signup",
    });

    return NextResponse.json({
      challengeId: challenge.id,
      email: normalizedEmail,
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Signup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
