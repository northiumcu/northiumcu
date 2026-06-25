import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("cot_required, imf_required, bill_pay_enabled")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      cotRequired: profile?.cot_required ?? false,
      imfRequired: profile?.imf_required ?? false,
      billPayEnabled: profile?.bill_pay_enabled !== false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
