import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const accountId = searchParams.get("accountId");

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: accounts } = await admin
      .from("accounts")
      .select("id")
      .eq("member_id", user.id);

    const accountIds = accountId
      ? [accountId]
      : (accounts ?? []).map((a) => a.id);

    if (accountIds.length === 0) {
      return NextResponse.json({ transactions: [] });
    }

    let query = admin
      .from("transactions")
      .select(
        "id, account_id, amount, type, status, description, posted_at, created_at, reference"
      )
      .in("account_id", accountIds)
      .eq("status", "posted")
      .order("posted_at", { ascending: false })
      .limit(200);

    if (from) query = query.gte("posted_at", new Date(from).toISOString());
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      query = query.lte("posted_at", toDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transactions: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
