import type { SupabaseClient } from "@supabase/supabase-js";

export const PENDING_SIGNUP_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const SIGNUP_OTP_TTL_MS = 30 * 60 * 1000;
export const SIGNUP_RESEND_COOLDOWN_MS = 60 * 1000;

export type SignupStage =
  | "none"
  | "pending_verification"
  | "registered_incomplete"
  | "registered_complete"
  | "expired";

export type SignupStatus = {
  stage: SignupStage;
  email?: string;
  maskedEmail?: string;
  challengeId?: string;
  firstName?: string;
  expiresAt?: string;
  message?: string;
};

type AdminClient = SupabaseClient;

export function pendingSignupExpiresAt(from = Date.now()) {
  return new Date(from + PENDING_SIGNUP_TTL_MS).toISOString();
}

export function signupOtpExpiresAt(from = Date.now()) {
  return new Date(from + SIGNUP_OTP_TTL_MS).toISOString();
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}${"*".repeat(Math.max(1, user.length - visible.length))}@${domain}`;
}

export async function getActiveSignupChallenge(admin: AdminClient, email: string) {
  const now = new Date().toISOString();
  const { data } = await admin
    .from("auth_otp_challenges")
    .select("id, expires_at, attempts, max_attempts, created_at")
    .eq("email", email)
    .eq("purpose", "signup")
    .is("consumed_at", null)
    .gt("expires_at", now)
    .lt("attempts", 5)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function invalidateSignupChallenges(admin: AdminClient, email: string) {
  const now = new Date().toISOString();
  await admin
    .from("auth_otp_challenges")
    .update({ consumed_at: now })
    .eq("email", email)
    .eq("purpose", "signup")
    .is("consumed_at", null);
}

export async function resolveSignupStatus(
  admin: AdminClient,
  rawEmail: string
): Promise<SignupStatus> {
  const email = rawEmail.toLowerCase().trim();

  const { data: profile } = await admin
    .from("profiles")
    .select("id, member_status, email, first_name")
    .eq("email", email)
    .maybeSingle();

  if (profile) {
    if (profile.member_status === "active") {
      return {
        stage: "registered_complete",
        email,
        maskedEmail: maskEmail(email),
        message: "You already have an active membership. Sign in to access your account.",
      };
    }

    const { data: application } = await admin
      .from("membership_applications")
      .select("status")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const incomplete =
      profile.member_status === "applicant" &&
      (!application || application.status !== "approved");

    if (incomplete) {
      return {
        stage: "registered_incomplete",
        email,
        maskedEmail: maskEmail(email),
        firstName: profile.first_name ?? undefined,
        message:
          "Your email is verified. Sign in with your username and PIN to finish membership in your portal.",
      };
    }

    return {
      stage: "registered_complete",
      email,
      maskedEmail: maskEmail(email),
      message: "This email is already registered. Sign in to continue.",
    };
  }

  const { data: pending } = await admin
    .from("pending_signups")
    .select("email, first_name, expires_at")
    .eq("email", email)
    .maybeSingle();

  if (!pending) {
    return { stage: "none", email };
  }

  if (new Date(pending.expires_at) < new Date()) {
    return {
      stage: "expired",
      email,
      maskedEmail: maskEmail(email),
      firstName: pending.first_name,
      message:
        "Your application session expired. Submit the form again or enter your email below to restart verification.",
    };
  }

  const challenge = await getActiveSignupChallenge(admin, email);

  return {
    stage: "pending_verification",
    email,
    maskedEmail: maskEmail(email),
    firstName: pending.first_name,
    challengeId: challenge?.id,
    expiresAt: pending.expires_at,
    message: challenge
      ? "Continue email verification to finish creating your account."
      : "Request a new verification code to continue your application.",
  };
}

export async function ensureMembershipApplication(
  admin: AdminClient,
  profileId: string,
  pending: {
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    eligibility_category: string | null;
    requested_account_types: string[] | null;
  }
) {
  const { data: existing } = await admin
    .from("membership_applications")
    .select("id")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    return existing;
  }

  const { data: application, error } = await admin
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

  if (error || !application) {
    throw new Error(error?.message ?? "Failed to create membership application.");
  }

  return application;
}
