import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActiveMemberWrite, requireAuthenticatedMember } from "@/lib/auth/require-member";
import { billPayPayeeSchema } from "@/lib/auth/validators";
import { encryptSensitive, lastFour } from "@/lib/auth/crypto";
import { BILL_PAY_INTERNAL_ROUTING, toBillPayPayeeView } from "@/lib/banking/bill-pay";

async function assertBillPayEnabled(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: profile } = await admin
    .from("profiles")
    .select("bill_pay_enabled")
    .eq("id", userId)
    .single();

  if (profile?.bill_pay_enabled === false) {
    return NextResponse.json(
      { error: "Bill Pay is currently unavailable on your account." },
      { status: 403 }
    );
  }

  return null;
}

export async function GET() {
  try {
    const auth = await requireAuthenticatedMember();
    if ("error" in auth) return auth.error;

    const blocked = await assertBillPayEnabled(auth.admin, auth.user.id);
    if (blocked) return blocked;

    const { data, error } = await auth.admin
      .from("bill_pay_payees")
      .select("*")
      .eq("member_id", auth.user.id)
      .eq("is_active", true)
      .order("nickname", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      payees: (data ?? []).map((payee) => toBillPayPayeeView(payee)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load payees.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireActiveMemberWrite();
    if ("error" in auth) return auth.error;

    const blocked = await assertBillPayEnabled(auth.admin, auth.user.id);
    if (blocked) return blocked;

    const body = await request.json();
    const parsed = billPayPayeeSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      return NextResponse.json({ error: firstError ?? "Invalid payee." }, { status: 400 });
    }

    const accountDigits = parsed.data.accountNumber.replace(/\D/g, "");

    const { data, error } = await auth.admin
      .from("bill_pay_payees")
      .insert({
        member_id: auth.user.id,
        nickname: parsed.data.nickname,
        payee_name: parsed.data.payeeName,
        routing_number: BILL_PAY_INTERNAL_ROUTING,
        account_number_encrypted: encryptSensitive(accountDigits),
        account_last_four: lastFour(accountDigits),
        category: parsed.data.category ?? null,
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Failed to save payee." }, { status: 500 });
    }

    return NextResponse.json({
      message: "Payee added.",
      payee: toBillPayPayeeView(data),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save payee.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
