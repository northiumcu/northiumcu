import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActiveMemberWrite, requireAuthenticatedMember } from "@/lib/auth/require-member";
import { notifyMember } from "@/lib/banking/member-notifications";

const applySchema = z.object({
  loanType: z.enum(["personal", "home", "auto", "business"]),
  purpose: z.string().trim().min(3).max(120),
  requestedAmount: z.number().positive().max(5_000_000),
  termMonths: z.number().int().min(6).max(360),
});

export async function GET() {
  try {
    const auth = await requireAuthenticatedMember();
    if ("error" in auth) return auth.error;

    const { data, error } = await auth.admin
      .from("loans")
      .select(
        "id, loan_type, purpose, principal_amount, requested_amount, outstanding_balance, interest_rate, term_months, status, monthly_payment, funded_at, created_at, admin_note"
      )
      .eq("member_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const approved = (data ?? []).filter((l) =>
      ["approved", "funded", "active"].includes(l.status)
    );
    const applications = (data ?? []).filter((l) =>
      ["application", "underwriting"].includes(l.status)
    );

    return NextResponse.json({ loans: approved, applications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      return NextResponse.json({ error: firstError ?? "Invalid application." }, { status: 400 });
    }

    const auth = await requireActiveMemberWrite();
    if ("error" in auth) return auth.error;

    const admin = createAdminClient();
    const input = parsed.data;
    const userId = auth.user.id;

    const { data: loan, error } = await admin
      .from("loans")
      .insert({
        member_id: userId,
        loan_type: input.loanType,
        purpose: input.purpose,
        principal_amount: input.requestedAmount,
        requested_amount: input.requestedAmount,
        outstanding_balance: 0,
        term_months: input.termMonths,
        status: "application",
        interest_rate: input.loanType === "home" ? 6.25 : 8.99,
      })
      .select("id, loan_type, purpose, requested_amount, status, term_months")
      .single();

    if (error || !loan) {
      return NextResponse.json({ error: error?.message }, { status: 500 });
    }

    await notifyMember(admin, {
      userId: userId,
      title: "Loan application submitted",
      message: `Your ${input.loanType.replace("_", " ")} application is under review.`,
      category: "transactional",
    });

    return NextResponse.json({ loan });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Application failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
