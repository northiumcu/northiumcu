import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOtpCode, hashOtp, verifyPin } from "@/lib/auth/crypto";
import { loginSchema } from "@/lib/auth/validators";
import { sendOtpEmail } from "@/lib/email/send-otp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { username, pin } = parsed.data;
    const admin = createAdminClient();
    const normalizedUsername = username.toLowerCase();

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

    if (!verifyPin(pin, profile.pin_hash)) {
      return NextResponse.json(
        { error: "Invalid username or PIN." },
        { status: 401 }
      );
    }

    const otp = generateOtpCode();
    const next = typeof body.next === "string" ? body.next : undefined;
    const defaultNext =
      profile.staff_role !== "member" ? "/admin" : "/member";

    const { data: challenge, error: otpError } = await admin
      .from("auth_otp_challenges")
      .insert({
        profile_id: profile.id,
        email: profile.email,
        purpose: "login",
        code_hash: hashOtp(otp),
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        metadata: { next: next ?? defaultNext },
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
