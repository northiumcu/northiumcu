import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("staff_role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.staff_role === "member") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, admin, profile };
}

export async function GET() {
  try {
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;
    const { admin } = auth;

    const { data, error } = await admin
      .from("membership_applications")
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        phone,
        status,
        submitted_at,
        created_at,
        profile_id,
        requested_account_types,
        kyc_verifications (
          id,
          status,
          ssn_last_four,
          id_document_type,
          id_document_last_four,
          reviewed_at
        )
      `
      )
      .in("status", ["submitted", "under_review"])
      .order("submitted_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ applications: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load applications.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
