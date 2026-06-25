import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { generateMemberTransactions } from "@/lib/banking/generate-member-transactions";

const generateSchema = z.object({
  accountId: z.string().uuid(),
  employerCompanyName: z.string().trim().min(1).max(120),
  addressState: z.string().trim().max(2).optional(),
  debitCount: z.number().int().min(0).max(200),
  creditCount: z.number().int().min(0).max(200),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memberId } = await context.params;
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;
    const { admin } = auth;

    const body = await request.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      return NextResponse.json({ error: firstError ?? "Invalid input." }, { status: 400 });
    }

    const input = parsed.data;

    const { data: account, error: accountError } = await admin
      .from("accounts")
      .select("id, member_id, status")
      .eq("id", input.accountId)
      .eq("member_id", memberId)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: "Account not found for member." }, { status: 404 });
    }

    if (account.status !== "active") {
      return NextResponse.json({ error: "Account is not active." }, { status: 400 });
    }

    if (input.debitCount === 0 && input.creditCount === 0) {
      return NextResponse.json(
        { error: "Set at least one debit or credit to generate." },
        { status: 400 }
      );
    }

    await admin
      .from("profiles")
      .update({
        employer_company_name: input.employerCompanyName,
        address_state: input.addressState?.toUpperCase() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", memberId);

    const summary = await generateMemberTransactions(admin, {
      accountId: input.accountId,
      employerCompanyName: input.employerCompanyName,
      addressState: input.addressState ?? "TX",
      debitCount: input.debitCount,
      creditCount: input.creditCount,
    });

    const { data: updatedAccount } = await admin
      .from("accounts")
      .select("balance, available_balance")
      .eq("id", input.accountId)
      .single();

    return NextResponse.json({
      message: "Transactions generated.",
      summary,
      account: updatedAccount,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Transaction generation failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
