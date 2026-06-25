import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";

export async function GET() {
  try {
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;
    const { admin } = auth;

    const { data: profiles, error } = await admin
      .from("profiles")
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        member_status,
        member_number,
        employer_company_name,
        address_state,
        cot_required,
        imf_required,
        delay_transactions,
        cot_code_encrypted,
        imf_code_encrypted,
        accounts (
          id,
          account_number,
          type,
          balance,
          available_balance,
          status
        )
      `
      )
      .eq("staff_role", "member")
      .order("last_name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const members = (profiles ?? []).map(
      ({ cot_code_encrypted, imf_code_encrypted, ...member }) => ({
        ...member,
        has_cot_code: Boolean(cot_code_encrypted),
        has_imf_code: Boolean(imf_code_encrypted),
      })
    );

    return NextResponse.json({ members });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load members.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
