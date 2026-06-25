import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";
import { notifyMember } from "@/lib/banking/member-notifications";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const reason =
      typeof body.reason === "string" ? body.reason : "Application rejected.";

    const auth = await requireStaff();
    if ("error" in auth) return auth.error;
    const { admin, user } = auth;

    const { data: app } = await admin
      .from("membership_applications")
      .select("profile_id")
      .eq("id", id)
      .single();

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

    if (app?.profile_id) {
      await notifyMember(admin, {
        userId: app.profile_id,
        title: "Membership application declined",
        message: reason,
        category: "transactional",
      });
    }

    return NextResponse.json({ message: "Application rejected." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rejection failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
