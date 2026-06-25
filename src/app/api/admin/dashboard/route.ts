import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";
import { fetchAdminOperationalStats } from "@/lib/admin/operational-stats";

export async function GET() {
  try {
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;

    const stats = await fetchAdminOperationalStats(auth.admin);
    return NextResponse.json({ stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
