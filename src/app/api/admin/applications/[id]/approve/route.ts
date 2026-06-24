import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("staff_role")
      .eq("id", user.id)
      .single();

    if (
      !profile ||
      !["administrator", "super_administrator", "operations_manager", "compliance_officer"].includes(
        profile.staff_role
      )
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: application } = await admin
      .from("membership_applications")
      .select("requested_account_types")
      .eq("id", id)
      .single();

    const accountTypes = application?.requested_account_types ?? ["checking"];
    const primaryType = accountTypes[0] ?? "checking";

    const { data: account, error } = await admin.rpc("approve_membership_application", {
      p_application_id: id,
      p_admin_id: user.id,
      p_account_type: primaryType,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "Membership approved and account number issued.",
      account,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approval failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
