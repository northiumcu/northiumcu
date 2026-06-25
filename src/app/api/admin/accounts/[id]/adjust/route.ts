import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { postAccountTransaction } from "@/lib/banking/post-transaction";
import { buildTransactionReference } from "@/lib/banking/transaction-reference";
import {
  logAdminAction,
  requestAuditContext,
} from "@/lib/audit/log-admin-action";

const adjustSchema = z.object({
  direction: z.enum(["credit", "debit"]),
  amount: z.number().positive().max(10_000_000),
  description: z.string().trim().min(1).max(200).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await context.params;
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;
    const { admin } = auth;

    const body = await request.json();
    const parsed = adjustSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      return NextResponse.json({ error: firstError ?? "Invalid input." }, { status: 400 });
    }

    const { direction, amount, description } = parsed.data;
    const label =
      description ??
      (direction === "credit" ? "Admin credit — manual fund" : "Admin debit — manual adjustment");

    const result = await postAccountTransaction(admin, {
      accountId,
      amount,
      direction,
      type: "adjustment",
      description: label,
      reference: buildTransactionReference(),
    });

    const audit = requestAuditContext(request);
    await logAdminAction(admin, {
      actorId: auth.profile.id,
      actorRole: auth.profile.staff_role,
      action: `admin.account.${direction}`,
      resourceType: "account",
      resourceId: accountId,
      reasonNote: label,
      metadata: { amount, direction },
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Adjustment failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
