import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashPin, verifyOtp } from "@/lib/auth/crypto";
import { resetPinSchema } from "@/lib/auth/validators";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const limited = enforceRateLimit(request, "auth:reset-pin", 8, 60_000);
    if (limited) return limited;

    const body = await request.json();
    const parsed = resetPinSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      return NextResponse.json(
        { error: firstError ?? "Invalid PIN reset request." },
        { status: 400 }
      );
    }

    const { challengeId, code, newPin } = parsed.data;
    const admin = createAdminClient();

    const { data: challenge, error: challengeError } = await admin
      .from("auth_otp_challenges")
      .select("*")
      .eq("id", challengeId)
      .is("consumed_at", null)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
    }

    if (challenge.purpose !== "pin_reset" || !challenge.profile_id) {
      return NextResponse.json({ error: "Invalid reset session." }, { status: 400 });
    }

    if (new Date(challenge.expires_at) < new Date()) {
      return NextResponse.json({ error: "Code has expired." }, { status: 400 });
    }

    if (challenge.attempts >= challenge.max_attempts) {
      return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
    }

    if (!verifyOtp(code, challenge.code_hash)) {
      await admin
        .from("auth_otp_challenges")
        .update({ attempts: challenge.attempts + 1 })
        .eq("id", challengeId);
      return NextResponse.json({ error: "Incorrect verification code." }, { status: 401 });
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        pin_hash: hashPin(newPin),
        updated_at: new Date().toISOString(),
      })
      .eq("id", challenge.profile_id)
      .eq("staff_role", "member");

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    await admin
      .from("auth_otp_challenges")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", challengeId);

    return NextResponse.json({
      message: "Your account PIN has been updated. You can sign in with your new PIN.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PIN reset failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
