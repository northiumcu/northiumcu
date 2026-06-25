import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildTransferReceiptPdf } from "@/lib/banking/pdf-documents";
import { buildTransferReference } from "@/lib/banking/transaction-reference";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: transfer, error } = await admin
      .from("transfers")
      .select(
        "id, type, status, amount, memo, beneficiary_name, zelle_contact, completed_at, created_at, source_account_id"
      )
      .eq("id", id)
      .eq("member_id", user.id)
      .single();

    if (error || !transfer) {
      return NextResponse.json({ error: "Transfer not found." }, { status: 404 });
    }

    const { data: sourceAccount } = await admin
      .from("accounts")
      .select("account_number")
      .eq("id", transfer.source_account_id)
      .single();

    if (transfer.status !== "completed") {
      return NextResponse.json(
        { error: "Receipt available only for completed transfers." },
        { status: 400 }
      );
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const pdf = await buildTransferReceiptPdf({
      reference: buildTransferReference(transfer.id),
      memberName: `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim(),
      accountMask: sourceAccount ? `••••${sourceAccount.account_number.slice(-4)}` : "—",
      type: transfer.type,
      amount: Number(transfer.amount),
      beneficiary: transfer.beneficiary_name ?? transfer.zelle_contact ?? "Recipient",
      status: transfer.status,
      completedAt: transfer.completed_at ?? transfer.created_at,
      memo: transfer.memo,
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="northium-transfer-${transfer.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Receipt failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
