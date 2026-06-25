import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";

export async function GET() {
  try {
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;
    const { admin } = auth;

    const { data, error } = await admin
      .from("loans")
      .select(
        "id, member_id, loan_type, purpose, requested_amount, principal_amount, term_months, status, created_at"
      )
      .in("status", ["application", "underwriting"])
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const memberIds = [...new Set((data ?? []).map((l) => l.member_id))];
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", memberIds);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const applications = (data ?? []).map((loan) => ({
      ...loan,
      member: profileMap.get(loan.member_id) ?? null,
    }));

    return NextResponse.json({ applications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
