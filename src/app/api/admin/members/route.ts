import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";
import { provisionApprovedMember } from "@/lib/auth/provision-member";
import { adminCreateMemberSchema } from "@/lib/auth/validators";

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

export async function POST(request: Request) {
  try {
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;

    const body = await request.json();
    const parsed = adminCreateMemberSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      return NextResponse.json(
        { error: firstError ?? "Invalid member details." },
        { status: 400 }
      );
    }

    const member = await provisionApprovedMember(
      auth.admin,
      auth.user.id,
      parsed.data
    );

    return NextResponse.json({
      message: "Member created and approved.",
      member,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create member.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
