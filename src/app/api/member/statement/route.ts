import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildStatementPdf } from "@/lib/banking/pdf-documents";
import { transactionLedgerType } from "@/lib/banking/transaction-ledger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!accountId || !from || !to) {
      return NextResponse.json(
        { error: "accountId, from, and to are required." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: account, error: accountError } = await admin
      .from("accounts")
      .select("id, type, balance, account_number, opened_at")
      .eq("id", accountId)
      .eq("member_id", user.id)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const { data: transactions, error: txError } = await admin
      .from("transactions")
      .select("amount, type, description, posted_at, created_at, ledger_direction")
      .eq("account_id", accountId)
      .eq("status", "posted")
      .gte("posted_at", fromDate.toISOString())
      .lte("posted_at", toDate.toISOString())
      .order("posted_at", { ascending: true });

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const rows = (transactions ?? []).map((tx) => ({
      date: new Date(tx.posted_at ?? tx.created_at).toLocaleDateString(),
      description: tx.description,
      amount: Number(tx.amount),
      type: transactionLedgerType(tx),
    }));

    let running = Number(account.balance);
    for (let i = rows.length - 1; i >= 0; i -= 1) {
      const row = rows[i]!;
      if (row.type === "credit") running -= row.amount;
      else running += row.amount;
    }
    const openingBalance = Math.max(0, running);
    const closingBalance = Number(account.balance);

    const pdf = await buildStatementPdf({
      memberName: `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim(),
      accountMask: `••••${account.account_number.slice(-4)}`,
      accountType: account.type,
      periodLabel: `${fromDate.toLocaleDateString()} – ${toDate.toLocaleDateString()}`,
      openingBalance,
      closingBalance,
      rows,
    });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="northium-statement-${account.account_number.slice(-4)}.pdf"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Statement failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
