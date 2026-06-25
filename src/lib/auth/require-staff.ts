import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";

const STAFF_ROLES = [
  "administrator",
  "super_administrator",
  "operations_manager",
  "compliance_officer",
] as const;

export async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, staff_role, email, first_name, last_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.staff_role === "member") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  if (!STAFF_ROLES.includes(profile.staff_role as (typeof STAFF_ROLES)[number])) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, admin: admin as SupabaseClient, profile };
}
