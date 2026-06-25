import { NextResponse } from "next/server";
import { billPayPayeeSchema } from "@/lib/auth/validators";
import { requireActiveMemberWrite } from "@/lib/auth/require-member";
import { encryptSensitive, lastFour } from "@/lib/auth/crypto";
import { toBillPayPayeeView } from "@/lib/banking/bill-pay";
import { createAdminClient } from "@/lib/supabase/admin";

async function assertBillPayEnabled(userId: string) {
  const admin = createAdminClient();
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireActiveMemberWrite();
    if ("error" in auth) return auth.error;

    const blocked = await assertBillPayEnabled(auth.user.id);
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
      .update({
        nickname: parsed.data.nickname,
        payee_name: parsed.data.payeeName,
        routing_number: parsed.data.routingNumber,
        account_number_encrypted: encryptSensitive(accountDigits),
        account_last_four: lastFour(accountDigits),
        category: parsed.data.category ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("member_id", auth.user.id)
      .eq("is_active", true)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Payee not found." }, { status: 404 });
    }

    return NextResponse.json({
      message: "Payee updated.",
      payee: toBillPayPayeeView(data),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update payee.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireActiveMemberWrite();
    if ("error" in auth) return auth.error;

    const blocked = await assertBillPayEnabled(auth.user.id);
    if (blocked) return blocked;

    const { data, error } = await auth.admin
      .from("bill_pay_payees")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("member_id", auth.user.id)
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Payee not found." }, { status: 404 });
    }

    return NextResponse.json({ message: "Payee removed." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove payee.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
