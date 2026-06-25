import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 50;
const MAX_STATEMENT_PAGE_SIZE = 500;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const accountId = searchParams.get("accountId");
    const hasDateFilter = Boolean(from || to);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const requestedLimit = Number.parseInt(searchParams.get("limit") ?? "", 10);
    const limit = hasDateFilter
      ? Math.min(
          MAX_STATEMENT_PAGE_SIZE,
          Math.max(1, requestedLimit || MAX_STATEMENT_PAGE_SIZE)
        )
      : Math.min(
          MAX_PAGE_SIZE,
          Math.max(1, requestedLimit || DEFAULT_PAGE_SIZE)
        );
    const offset = hasDateFilter ? 0 : (page - 1) * limit;

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

    const memberAccountIds = new Set((accounts ?? []).map((account) => account.id));

    if (accountId && !memberAccountIds.has(accountId)) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const accountIds = accountId ? [accountId] : [...memberAccountIds];

    if (accountIds.length === 0) {
      return NextResponse.json({
        transactions: [],
        pagination: { page: 1, limit, total: 0, totalPages: 1 },
      });
    }

    let countQuery = admin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .in("account_id", accountIds)
      .eq("status", "posted");

    let dataQuery = admin
      .from("transactions")
      .select(
        "id, account_id, amount, type, status, description, posted_at, created_at, reference"
      )
      .in("account_id", accountIds)
      .eq("status", "posted")
      .order("posted_at", { ascending: false });

    if (from) {
      const fromIso = new Date(from).toISOString();
      countQuery = countQuery.gte("posted_at", fromIso);
      dataQuery = dataQuery.gte("posted_at", fromIso);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      const toIso = toDate.toISOString();
      countQuery = countQuery.lte("posted_at", toIso);
      dataQuery = dataQuery.lte("posted_at", toIso);
    }

    if (!hasDateFilter) {
      dataQuery = dataQuery.range(offset, offset + limit - 1);
    } else {
      dataQuery = dataQuery.limit(limit);
    }

    const [{ count, error: countError }, { data, error: dataError }] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    if (dataError) {
      return NextResponse.json({ error: dataError.message }, { status: 500 });
    }

    const total = count ?? 0;
    const totalPages = hasDateFilter ? 1 : Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      transactions: data ?? [],
      pagination: {
        page: hasDateFilter ? 1 : page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
