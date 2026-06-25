import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transferCreateSchema } from "@/lib/auth/validators";
import { executeMemberTransfer } from "@/lib/banking/execute-transfer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = transferCreateSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      return NextResponse.json(
        { error: firstError ?? "Invalid transfer details." },
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
    const result = await executeMemberTransfer(admin, user.id, parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transfer failed.";
    const status = message.includes("PIN") || message.includes("Code") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
