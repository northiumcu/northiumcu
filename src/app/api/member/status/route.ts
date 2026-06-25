import { NextResponse } from "next/server";
import { requireAuthenticatedMember } from "@/lib/auth/require-member";

export async function GET() {
  try {
    const auth = await requireAuthenticatedMember();
    if ("error" in auth) return auth.error;

    return NextResponse.json({
      memberStatus: auth.profile.member_status,
      paused: auth.profile.member_status === "paused",
      suspended: auth.profile.member_status === "suspended",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
