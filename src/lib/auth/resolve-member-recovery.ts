import type { SupabaseClient } from "@supabase/supabase-js";

export type MemberRecoveryTarget = {
  email: string;
  firstName: string;
  username: string;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function emailsMatch(stored: string | null | undefined, target: string): boolean {
  if (!stored?.trim()) return false;
  return normalizeEmail(stored) === target;
}

async function resolveUsername(
  admin: SupabaseClient,
  profileId: string,
  candidates: Array<string | null | undefined>
): Promise<string | null> {
  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }

  try {
    const { data: authUser } = await admin.auth.admin.getUserById(profileId);
    const metaUsername =
      typeof authUser?.user?.user_metadata?.username === "string"
        ? authUser.user.user_metadata.username.trim()
        : "";
    return metaUsername || null;
  } catch (error) {
    console.error("[Northium Recovery] Could not load auth metadata:", error);
    return null;
  }
}

function profileToRecoveryTarget(
  profile: {
    id: string;
    email: string | null;
    first_name: string | null;
    username: string | null;
    staff_role: string;
    member_status: string;
  },
  username: string,
  fallbackEmail?: string
): MemberRecoveryTarget | null {
  if (profile.staff_role !== "member") {
    return null;
  }

  const email = profile.email?.trim() || fallbackEmail?.trim();
  if (!email) return null;

  return {
    email: normalizeEmail(email),
    firstName: profile.first_name?.trim() || "Member",
    username,
  };
}

export async function resolveMemberRecoveryByEmail(
  admin: SupabaseClient,
  rawEmail: string
): Promise<MemberRecoveryTarget | null> {
  const normalizedEmail = normalizeEmail(rawEmail);
  if (!normalizedEmail.includes("@")) return null;

  const { data: profileRows, error: profileError } = await admin
    .from("profiles")
    .select("id, email, first_name, username, staff_role, member_status")
    .ilike("email", normalizedEmail);

  if (profileError) {
    console.error("[Northium Recovery] Profile lookup failed:", profileError.message);
  }

  for (const profile of profileRows ?? []) {
    if (!emailsMatch(profile.email, normalizedEmail)) continue;
    const username = await resolveUsername(admin, profile.id, [profile.username]);
    if (!username) continue;
    const target = profileToRecoveryTarget(profile, username);
    if (target) return target;
  }

  const { data: applications, error: applicationError } = await admin
    .from("membership_applications")
    .select("email, first_name, profile_id")
    .ilike("email", normalizedEmail)
    .order("created_at", { ascending: false })
    .limit(5);

  if (applicationError) {
    console.error(
      "[Northium Recovery] Application lookup failed:",
      applicationError.message
    );
  }

  for (const application of applications ?? []) {
    if (!application.profile_id || !emailsMatch(application.email, normalizedEmail)) {
      continue;
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("id, email, first_name, username, staff_role, member_status")
      .eq("id", application.profile_id)
      .maybeSingle();

    if (!profile) continue;

    const username = await resolveUsername(admin, profile.id, [profile.username]);
    if (!username) continue;

    const target = profileToRecoveryTarget(
      profile,
      username,
      application.email ?? profile.email ?? undefined
    );
    if (target) return target;
  }

  const { data: pending, error: pendingError } = await admin
    .from("pending_signups")
    .select("email, first_name, username, expires_at")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (pendingError) {
    console.error("[Northium Recovery] Pending signup lookup failed:", pendingError.message);
  }

  if (
    pending &&
    emailsMatch(pending.email, normalizedEmail) &&
    pending.username?.trim() &&
    new Date(pending.expires_at) >= new Date()
  ) {
    return {
      email: normalizeEmail(pending.email),
      firstName: pending.first_name?.trim() || "Member",
      username: pending.username.trim(),
    };
  }

  return null;
}
