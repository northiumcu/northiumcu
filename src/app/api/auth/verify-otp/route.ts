import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptSensitive, verifyOtp } from "@/lib/auth/crypto";
import { resolvePostLoginPath } from "@/lib/auth/admin-paths";
import { SUSPENDED_MESSAGE } from "@/lib/auth/require-member";
import { sendWelcomeMemberEmail } from "@/lib/email/send-welcome";
import { otpVerifySchema } from "@/lib/auth/validators";
import {
  ensureMembershipApplication,
  pendingSignupExpiresAt,
} from "@/lib/auth/signup-session";

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
      return NextResponse.json(
        {
          error: "Code has expired. Request a new verification code to continue.",
          canResend: challenge.purpose === "signup",
        },
        { status: 400 }
      );
    }

    if (challenge.attempts >= challenge.max_attempts) {
      return NextResponse.json(
        {
          error: "Too many attempts. Request a new verification code to continue.",
          canResend: challenge.purpose === "signup",
        },
        { status: 429 }
      );
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
        const { data: existingProfile } = await admin
          .from("profiles")
          .select("id, email, internal_auth_secret, member_status, first_name")
          .eq("email", challenge.email)
          .maybeSingle();

        if (existingProfile?.internal_auth_secret) {
          const internalPassword = decryptSensitive(existingProfile.internal_auth_secret);
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
            email: existingProfile.email,
            password: internalPassword,
          });

          if (!signInError) {
            return NextResponse.json({
              verified: true,
              redirectTo: "/member",
              message:
                "Welcome back. Complete identity verification in your member portal to finish membership.",
            });
          }
        }

        return NextResponse.json(
          {
            error:
              "Application session not found. Submit your application again or request a new verification code.",
            canResend: true,
          },
          { status: 404 }
        );
      }

      if (new Date(pending.expires_at) < new Date()) {
        await admin
          .from("pending_signups")
          .update({ expires_at: pendingSignupExpiresAt() })
          .eq("email", pending.email);
      }

      const internalPassword = decryptSensitive(pending.internal_auth_secret);
      let profileId: string;
      let createdNewAccount = false;

      const { data: existingProfile } = await admin
        .from("profiles")
        .select("id, email, internal_auth_secret, member_status")
        .eq("email", pending.email)
        .maybeSingle();

      if (existingProfile) {
        profileId = existingProfile.id;
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
      } else {
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
          const duplicate =
            createError?.message?.toLowerCase().includes("already") ?? false;
          if (!duplicate) {
            return NextResponse.json(
              { error: createError?.message ?? "Failed to create account." },
              { status: 500 }
            );
          }

          const { data: recoveredProfile } = await admin
            .from("profiles")
            .select("id")
            .eq("email", pending.email)
            .maybeSingle();

          if (!recoveredProfile) {
            return NextResponse.json(
              { error: "Failed to recover your account. Please contact support." },
              { status: 500 }
            );
          }

          profileId = recoveredProfile.id;
        } else {
          profileId = authUser.user.id;
          createdNewAccount = true;
        }

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
      }

      try {
        await ensureMembershipApplication(admin, profileId, pending);
      } catch (applicationError) {
        const message =
          applicationError instanceof Error
            ? applicationError.message
            : "Failed to create membership application.";
        return NextResponse.json({ error: message }, { status: 500 });
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
            redirectTo: "/sign-in",
            message:
              "Email verified. Sign in with your username and PIN to continue membership.",
          },
          { status: 200 }
        );
      }

      if (createdNewAccount) {
        await sendWelcomeMemberEmail({
          to: pending.email,
          firstName: pending.first_name,
        });
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
        .select("email, internal_auth_secret, staff_role, member_status")
        .eq("id", challenge.profile_id)
        .single();

      if (profileError || !profile?.internal_auth_secret) {
        return NextResponse.json({ error: "Account not found." }, { status: 404 });
      }

      if (profile.member_status === "suspended") {
        return NextResponse.json({ error: SUSPENDED_MESSAGE, suspended: true }, { status: 403 });
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

      const rawNext = (challenge.metadata as { next?: string })?.next;
      const isStaff = profile.staff_role !== "member";
      const redirectTo = resolvePostLoginPath(rawNext, isStaff);

      return NextResponse.json({
        verified: true,
        redirectTo,
      });
    }

    return NextResponse.json({ error: "Unsupported challenge." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Verification failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
