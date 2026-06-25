import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";

export async function GET(request: Request) {
  try {
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 100), 200);

    const { data, error } = await auth.admin
      .from("audit_logs")
      .select(
        "id, action, actor_id, actor_role, resource_type, resource_id, ip_address, created_at, reason_note, channel"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const actorIds = [
      ...new Set((data ?? []).map((row) => row.actor_id).filter(Boolean)),
    ] as string[];

    const { data: actors } = actorIds.length
      ? await auth.admin
          .from("profiles")
          .select("id, first_name, last_name, email, staff_role")
          .in("id", actorIds)
      : { data: [] };

    const actorMap = new Map((actors ?? []).map((actor) => [actor.id, actor]));

    const logs = (data ?? []).map((row) => ({
      ...row,
      actor: row.actor_id ? actorMap.get(row.actor_id) ?? null : null,
    }));

    return NextResponse.json({ logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
