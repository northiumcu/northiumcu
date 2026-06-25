import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  resolvePostLoginPath,
} from "@/lib/auth/admin-paths";
import { SUSPENDED_MESSAGE } from "@/lib/auth/require-member";
import { generateOtpCode, hashOtp, verifyPin } from "@/lib/auth/crypto";
import { loginSchema } from "@/lib/auth/validators";
import { sendOtpEmail } from "@/lib/email/send-otp";
import { EmailDeliveryError } from "@/lib/email/config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      return NextResponse.json(
        { error: firstError ?? "Invalid sign-in details." },
        { status: 400 }
      );
    }

    const { username, pin, next } = parsed.data;
    const admin = createAdminClient();
    const normalizedUsername = username.trim().toLowerCase();

    const { data: profile, error } = await admin
      .from("profiles")
      .select("id, email, pin_hash, staff_role, email_verified_at, member_status")
      .ilike("username", normalizedUsername)
      .single();

    if (error || !profile?.pin_hash) {
      return NextResponse.json(
        { error: "Invalid username or PIN." },
        { status: 401 }
      );
    }

    if (profile.member_status === "suspended") {
      return NextResponse.json({ error: SUSPENDED_MESSAGE, suspended: true }, { status: 403 });
    }

    const isStaff = profile.staff_role !== "member";

    if (isStaff) {
      return NextResponse.json(
        { error: "Invalid username or PIN." },
        { status: 401 }
      );
    }

    if (!verifyPin(pin, profile.pin_hash)) {
      return NextResponse.json(
        { error: "Invalid username or PIN." },
        { status: 401 }
      );
    }

    const otp = generateOtpCode();
    const redirectTo = resolvePostLoginPath(
      next,
      isStaff
    );

    const { data: challenge, error: otpError } = await admin
      .from("auth_otp_challenges")
      .insert({
        profile_id: profile.id,
        email: profile.email,
        purpose: "login",
        code_hash: hashOtp(otp),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        metadata: { next: redirectTo },
      })
      .select("id")
      .single();

    if (otpError || !challenge) {
      return NextResponse.json({ error: otpError?.message }, { status: 500 });
    }

    await sendOtpEmail({
      to: profile.email,
      code: otp,
      purpose: "login",
    });

    return NextResponse.json({
      challengeId: challenge.id,
      email: maskEmail(profile.email),
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    if (error instanceof EmailDeliveryError) {
      return NextResponse.json(
        {
          error:
            "We could not send your verification email. Please try again shortly or contact your account officer.",
        },
        { status: 503 }
      );
    }
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const visible = user.slice(0, 2);
  return `${visible}***@${domain}`;
}
