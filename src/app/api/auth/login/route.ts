import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  resolvePostLoginPath,
} from "@/lib/auth/admin-paths";
import { generateOtpCode, hashOtp, verifyPin } from "@/lib/auth/crypto";
import { loginSchema } from "@/lib/auth/validators";
import { sendOtpEmail } from "@/lib/email/send-otp";

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
      .select("id, email, pin_hash, staff_role, email_verified_at")
      .ilike("username", normalizedUsername)
      .single();

    if (error || !profile?.pin_hash) {
      return NextResponse.json(
        { error: "Invalid username or PIN." },
        { status: 401 }
      );
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

    try {
      await sendOtpEmail({
        to: profile.email,
        code: otp,
        purpose: "login",
      });
    } catch (error) {
      console.error("[Northium login] OTP email error:", error);
      console.info(`[Northium OTP] login → ${profile.email}: ${otp}`);
    }

    return NextResponse.json({
      challengeId: challenge.id,
      email: maskEmail(profile.email),
      message: "Verification code sent to your email.",
    });
  } catch (error) {
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
