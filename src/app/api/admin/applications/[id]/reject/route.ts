import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const reason =
      typeof body.reason === "string" ? body.reason : "Application rejected.";

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

    if (!profile || profile.staff_role === "member") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: appError } = await admin
      .from("membership_applications")
      .update({
        status: "rejected",
        rejection_reason: reason,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (appError) {
      return NextResponse.json({ error: appError.message }, { status: 500 });
    }

    await admin
      .from("kyc_verifications")
      .update({
        status: "rejected",
        rejection_reason: reason,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("application_id", id);

    return NextResponse.json({ message: "Application rejected." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rejection failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
