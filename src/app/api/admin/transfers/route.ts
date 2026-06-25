import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";

export async function GET() {
  try {
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;
    const { admin } = auth;

    const { data, error } = await admin
      .from("transfers")
      .select(
        "id, member_id, type, status, amount, beneficiary_name, zelle_contact, created_at, member_message, admin_decision"
      )
      .in("status", ["pending_approval", "pending", "processing"])
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const memberIds = [...new Set((data ?? []).map((t) => t.member_id))];
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", memberIds);

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const transfers = (data ?? []).map((t) => ({
      ...t,
      member: profileMap.get(t.member_id) ?? null,
    }));

    return NextResponse.json({ transfers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
