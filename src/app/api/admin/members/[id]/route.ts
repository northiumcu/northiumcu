import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { encryptSensitive } from "@/lib/auth/crypto";
import {
  logAdminAction,
  requestAuditContext,
} from "@/lib/audit/log-admin-action";

const updateMemberSchema = z.object({
  employerCompanyName: z.string().max(120).optional(),
  addressState: z
    .string()
    .max(2)
    .optional()
    .transform((v) => (v ? v.toUpperCase() : v)),
  cotCode: z.string().max(32).optional(),
  imfCode: z.string().max(32).optional(),
  cotRequired: z.boolean().optional(),
  imfRequired: z.boolean().optional(),
  delayTransactions: z.boolean().optional(),
  billPayEnabled: z.boolean().optional(),
  pauseTransfers: z.boolean().optional(),
  transferPauseReason: z.string().max(500).optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;
    const { admin } = auth;

    const { data, error } = await admin
      .from("profiles")
      .select(
        `
        id,
        email,
        first_name,
        last_name,
        member_status,
        member_number,
        employer_company_name,
        address_state,
        cot_required,
        imf_required,
        accounts (
          id,
          account_number,
          type,
          balance,
          available_balance,
          status
        )
      `
      )
      .eq("id", id)
      .eq("staff_role", "member")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    return NextResponse.json({ member: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load member.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;
    const { admin } = auth;

    const body = await request.json();
    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      return NextResponse.json({ error: firstError ?? "Invalid input." }, { status: 400 });
    }

    const input = parsed.data;
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (input.employerCompanyName !== undefined) {
      updates.employer_company_name = input.employerCompanyName.trim() || null;
    }
    if (input.addressState !== undefined) {
      updates.address_state = input.addressState?.trim() || null;
    }
    if (input.cotRequired !== undefined) {
      updates.cot_required = input.cotRequired;
    }
    if (input.imfRequired !== undefined) {
      updates.imf_required = input.imfRequired;
    }
    if (input.delayTransactions !== undefined) {
      updates.delay_transactions = input.delayTransactions;
    }
    if (input.billPayEnabled !== undefined) {
      updates.bill_pay_enabled = input.billPayEnabled;
    }
    if (input.pauseTransfers !== undefined) {
      updates.pause_transfers = input.pauseTransfers;
    }
    if (input.transferPauseReason !== undefined) {
      const trimmed = input.transferPauseReason.trim();
      updates.transfer_pause_reason = trimmed || null;
    }
    if (input.cotCode !== undefined) {
      const trimmed = input.cotCode.trim();
      updates.cot_code_encrypted = trimmed ? encryptSensitive(trimmed) : null;
    }
    if (input.imfCode !== undefined) {
      const trimmed = input.imfCode.trim();
      updates.imf_code_encrypted = trimmed ? encryptSensitive(trimmed) : null;
    }

    const { data, error } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .eq("staff_role", "member")
      .select(
        "id, employer_company_name, address_state, cot_required, imf_required, delay_transactions, bill_pay_enabled, pause_transfers, transfer_pause_reason"
      )
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Update failed." }, { status: 400 });
    }

    const audit = requestAuditContext(request);
    await logAdminAction(admin, {
      actorId: auth.profile.id,
      actorRole: auth.profile.staff_role,
      action: "admin.member.updated",
      resourceType: "profile",
      resourceId: id,
      metadata: {
        fields: Object.keys(input),
      },
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });

    return NextResponse.json({ member: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
