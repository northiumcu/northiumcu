import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const SUSPENDED_MESSAGE =
  "Your account has been suspended. Contact your Northium account officer for assistance.";

export const PAUSED_MESSAGE =
  "Your account is paused. Transfers and account changes are temporarily disabled.";

export type MemberProfile = {
  id: string;
  member_status: string;
  staff_role: string;
  email: string;
  first_name: string;
  last_name: string;
};

export async function getMemberProfile(userId: string) {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, member_status, staff_role, email, first_name, last_name")
    .eq("id", userId)
    .single();

  return profile;
}

export async function requireAuthenticatedMember() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const profile = await getMemberProfile(user.id);
  if (!profile) {
    return { error: NextResponse.json({ error: "Profile not found." }, { status: 404 }) };
  }

  if (profile.member_status === "suspended") {
    return {
      error: NextResponse.json({ error: SUSPENDED_MESSAGE, suspended: true }, { status: 403 }),
    };
  }

  return { user, profile, admin: createAdminClient() };
}

/** Blocks paused members from transfers, edits, and other mutations. */
export async function requireActiveMemberWrite() {
  const auth = await requireAuthenticatedMember();
  if ("error" in auth) return auth;

  if (auth.profile.member_status === "paused") {
    return {
      error: NextResponse.json({ error: PAUSED_MESSAGE, paused: true }, { status: 403 }),
    };
  }

  return auth;
}
