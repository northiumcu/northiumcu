import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { completeTransferAsAdmin } from "@/lib/banking/execute-transfer";

const decisionSchema = z.object({
  decision: z.enum(["approved", "denied", "delayed", "pending"]),
  note: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;
    const { admin, profile } = auth;

    const body = await request.json();
    const parsed = decisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
    }

    await completeTransferAsAdmin(
      admin,
      id,
      profile.id,
      parsed.data.decision,
      parsed.data.note
    );

    return NextResponse.json({ message: `Transfer ${parsed.data.decision}.` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
