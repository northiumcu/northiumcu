import { NextResponse } from "next/server";
import { requireActiveMemberWrite } from "@/lib/auth/require-member";
import { transferCreateSchema } from "@/lib/auth/validators";
import { executeMemberTransfer } from "@/lib/banking/execute-transfer";

export const maxDuration = 30;

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

    const auth = await requireActiveMemberWrite();
    if ("error" in auth) return auth.error;

    const result = await executeMemberTransfer(auth.admin, auth.user.id, parsed.data);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transfer failed.";
    const status = message.includes("PIN") || message.includes("Code") ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
