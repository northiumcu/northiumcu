import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { notifyMember } from "@/lib/banking/member-notifications";
import { issueMastercardCredentials } from "@/lib/banking/card-issuance";
import {
  logAdminAction,
  requestAuditContext,
} from "@/lib/audit/log-admin-action";

const decisionSchema = z.object({
  decision: z.enum(["approved", "denied"]),
  note: z.string().max(500).optional(),
});

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
    const parsed = decisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
    }

    const { data: card, error } = await admin
      .from("cards")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !card) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    if (card.status !== "ordered") {
      return NextResponse.json(
        { error: "Only pending card applications can be reviewed." },
        { status: 400 }
      );
    }

    const note = parsed.data.note?.trim();
    const now = new Date().toISOString();

    if (parsed.data.decision === "denied") {
      await admin
        .from("cards")
        .update({
          status: "cancelled",
          updated_at: now,
        })
        .eq("id", id);

      await notifyMember(admin, {
        userId: card.member_id,
        title: "Card application declined",
        message:
          note ??
          "Your Northium Mastercard application was not approved at this time. Contact your account officer with questions.",
        category: "transactional",
      });

      const audit = requestAuditContext(request);
      await logAdminAction(admin, {
        actorId: auth.profile.id,
        actorRole: auth.profile.staff_role,
        action: "admin.card.denied",
        resourceType: "card",
        resourceId: id,
        reasonNote: note,
        ipAddress: audit.ipAddress,
        userAgent: audit.userAgent,
      });

      return NextResponse.json({ message: "Card application denied." });
    }

    const credentials = issueMastercardCredentials();

    const { data: updated, error: updateError } = await admin
      .from("cards")
      .update({
        status: "active",
        last_four: credentials.lastFour,
        pan_encrypted: credentials.panEncrypted,
        cvv_encrypted: credentials.cvvEncrypted,
        expires_at: credentials.expiresAt,
        approved_at: now,
        delivery_eta: null,
        updated_at: now,
      })
      .eq("id", id)
      .select(
        "id, status, last_four, expires_at, product_name, cardholder_name, approved_at"
      )
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message ?? "Failed to issue card." },
        { status: 500 }
      );
    }

    await notifyMember(admin, {
      userId: card.member_id,
      title: "Your Northium Mastercard is ready",
      message:
        note ??
        "Your Northium Mastercard has been approved. Sign in to Cards to view your card details.",
      category: "transactional",
    });

    const audit = requestAuditContext(request);
    await logAdminAction(admin, {
      actorId: auth.profile.id,
      actorRole: auth.profile.staff_role,
      action: "admin.card.approved",
      resourceType: "card",
      resourceId: id,
      reasonNote: note,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });

    return NextResponse.json({
      message: "Card approved and issued.",
      card: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Card review failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
