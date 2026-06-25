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
import { EmailDeliveryError } from "@/lib/email/config";
import { verifyMathChallenge } from "@/lib/security/human-check";
import {
  invalidateSignupChallenges,
  pendingSignupExpiresAt,
  resolveSignupStatus,
  signupOtpExpiresAt,
} from "@/lib/auth/signup-session";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const limited = enforceRateLimit(request, "auth:signup", 6, 60_000);
    if (limited) return limited;

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

    const { data: existingUsername } = await admin
      .from("profiles")
      .select("id")
      .ilike("username", normalizedUsername)
      .maybeSingle();

    const signupStatus = await resolveSignupStatus(admin, normalizedEmail);
    if (signupStatus.stage === "registered_complete") {
      return NextResponse.json(
        { error: "This email is already registered. Sign in to continue." },
        { status: 409 }
      );
    }
    if (signupStatus.stage === "registered_incomplete") {
      return NextResponse.json(
        {
          error:
            "Your account is already created. Sign in with your username and PIN to finish membership.",
          stage: signupStatus.stage,
        },
        { status: 409 }
      );
    }

    if (existingUsername && signupStatus.stage === "none") {
      return NextResponse.json(
        { error: "Username is already registered." },
        { status: 409 }
      );
    }

    const internalSecret = generateInternalAuthSecret();
    const expiresAt = pendingSignupExpiresAt();

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

    await invalidateSignupChallenges(admin, normalizedEmail);

    const otp = generateOtpCode();
    const { data: challenge, error: otpError } = await admin
      .from("auth_otp_challenges")
      .insert({
        email: normalizedEmail,
        purpose: "signup",
        code_hash: hashOtp(otp),
        expires_at: signupOtpExpiresAt(),
        metadata: { username: normalizedUsername },
      })
      .select("id")
      .single();

    if (otpError || !challenge) {
      return NextResponse.json({ error: otpError?.message }, { status: 500 });
    }

    try {
      await sendOtpEmail({
        to: normalizedEmail,
        code: otp,
        purpose: "signup",
      });
    } catch (emailError) {
      await admin.from("auth_otp_challenges").delete().eq("id", challenge.id);
      throw emailError;
    }

    return NextResponse.json({
      challengeId: challenge.id,
      email: normalizedEmail,
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    if (error instanceof EmailDeliveryError) {
      return NextResponse.json(
        {
          error:
            "We could not send your verification email. Please try again in a moment or contact helpdesk@northiumcu.com.",
        },
        { status: 503 }
      );
    }
    const message = error instanceof Error ? error.message : "Signup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
