import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await _request.json().catch(() => ({}));
    const requireKyc = body.requireKyc !== false;

    const auth = await requireStaff();
    if ("error" in auth) return auth.error;
    const { admin, user } = auth;

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
      p_require_kyc: requireKyc,
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
