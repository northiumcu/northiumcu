import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSensitive, verifyOtp } from "@/lib/auth/crypto";
import { otpVerifySchema } from "@/lib/auth/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = otpVerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid verification request." }, { status: 400 });
    }

    const { challengeId, code } = parsed.data;
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

    await admin
      .from("auth_otp_challenges")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", challengeId);

    if (challenge.purpose === "signup") {
      const { data: pending, error: pendingError } = await admin
        .from("pending_signups")
        .select("*")
        .eq("email", challenge.email)
        .single();

      if (pendingError || !pending) {
        return NextResponse.json({ error: "Signup session not found." }, { status: 404 });
      }

      const internalPassword = decryptSensitive(pending.internal_auth_secret);

      const { data: authUser, error: createError } =
        await admin.auth.admin.createUser({
          email: pending.email,
          password: internalPassword,
          email_confirm: true,
          user_metadata: {
            first_name: pending.first_name,
            last_name: pending.last_name,
            username: pending.username,
          },
        });

      if (createError || !authUser.user) {
        return NextResponse.json(
          { error: createError?.message ?? "Failed to create account." },
          { status: 500 }
        );
      }

      const profileId = authUser.user.id;

      await admin
        .from("profiles")
        .update({
          username: pending.username,
          pin_hash: pending.pin_hash,
          phone: pending.phone,
          email_verified_at: new Date().toISOString(),
          internal_auth_secret: pending.internal_auth_secret,
          member_status: "applicant",
        })
        .eq("id", profileId);

      const { data: application, error: appError } = await admin
        .from("membership_applications")
        .insert({
          profile_id: profileId,
          email: pending.email,
          first_name: pending.first_name,
          last_name: pending.last_name,
          phone: pending.phone,
          status: "draft",
          eligibility_category: pending.eligibility_category,
          requested_account_types: pending.requested_account_types ?? ["checking"],
        })
        .select("id")
        .single();

      if (appError || !application) {
        return NextResponse.json({ error: appError?.message }, { status: 500 });
      }

      await admin.from("pending_signups").delete().eq("email", pending.email);

      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            },
          },
        }
      );

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: pending.email,
        password: internalPassword,
      });

      if (signInError) {
        return NextResponse.json(
          {
            verified: true,
            message:
              "Email verified. Sign in with your username and PIN to continue.",
          },
          { status: 200 }
        );
      }

      return NextResponse.json({
        verified: true,
        redirectTo: "/member",
        message:
          "Welcome to Northium. Complete identity verification in your member portal to finish membership.",
      });
    }

    if (challenge.purpose === "login" && challenge.profile_id) {
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("email, internal_auth_secret")
        .eq("id", challenge.profile_id)
        .single();

      if (profileError || !profile?.internal_auth_secret) {
        return NextResponse.json({ error: "Account not found." }, { status: 404 });
      }

      const internalPassword = decryptSensitive(profile.internal_auth_secret);
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            },
          },
        }
      );

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: internalPassword,
      });

      if (signInError) {
        return NextResponse.json({ error: signInError.message }, { status: 500 });
      }

      const next =
        (challenge.metadata as { next?: string })?.next ?? "/member";

      return NextResponse.json({
        verified: true,
        redirectTo: next,
      });
    }

    return NextResponse.json({ error: "Unsupported challenge." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
