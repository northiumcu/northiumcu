import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { notifyMember } from "@/lib/banking/member-notifications";

const decisionSchema = z.object({
  decision: z.enum(["approved", "denied", "delayed"]),
  note: z.string().max(500).optional(),
  monthlyPayment: z.number().positive().optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;
    const { admin } = auth;

    const body = await request.json();
    const parsed = decisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
    }

    const { data: loan, error } = await admin
      .from("loans")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !loan) {
      return NextResponse.json({ error: "Loan not found." }, { status: 404 });
    }

    const note = parsed.data.note;
    const updates: Record<string, unknown> = {
      admin_note: note ?? null,
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.decision === "approved") {
      const principal = Number(loan.requested_amount ?? loan.principal_amount);
      const monthly =
        parsed.data.monthlyPayment ??
        Math.round((principal / loan.term_months) * 100) / 100;
      Object.assign(updates, {
        status: "approved",
        principal_amount: principal,
        outstanding_balance: principal,
        monthly_payment: monthly,
      });
      await notifyMember(admin, {
        userId: loan.member_id,
        title: "Loan approved",
        message: note ?? `Your loan application for $${principal.toFixed(2)} has been approved.`,
        category: "transactional",
      });
    } else if (parsed.data.decision === "denied") {
      Object.assign(updates, { status: "denied" });
      await notifyMember(admin, {
        userId: loan.member_id,
        title: "Loan declined",
        message: note ?? "Your loan application was not approved at this time.",
        category: "transactional",
      });
    } else {
      Object.assign(updates, { status: "underwriting" });
      await notifyMember(admin, {
        userId: loan.member_id,
        title: "Loan review extended",
        message: note ?? "Your loan application requires additional review.",
        category: "transactional",
      });
    }

    await admin.from("loans").update(updates).eq("id", id);

    return NextResponse.json({ message: `Loan ${parsed.data.decision}.` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
