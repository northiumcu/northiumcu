import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { notifyMember } from "@/lib/banking/member-notifications";
import { issueMastercardCredentials } from "@/lib/banking/card-issuance";
import { postAccountTransaction } from "@/lib/banking/post-transaction";
import { MASTERCARD_FEE } from "@/lib/banking/member-products";
import {
  logAdminAction,
  requestAuditContext,
} from "@/lib/audit/log-admin-action";
import {
  buildCardApprovedEmail,
  buildCardDeclinedEmail,
  formatCardDeclineReason,
  formatDeliveryEtaLabel,
  physicalCardDeliveryEta,
} from "@/lib/email/card-alerts";
import { sendMemberEmail } from "@/lib/email/member-alerts";

const decisionSchema = z
  .object({
    decision: z.enum(["approved", "denied"]),
    note: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === "denied") {
      const reason = data.note?.trim() ?? "";
      if (reason.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "A decline reason is required (at least 10 characters) so the member can be notified.",
          path: ["note"],
        });
      }
    }
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
      const declineReason = formatCardDeclineReason(note ?? "");

      if (card.application_fee_paid && card.linked_account_id) {
        await postAccountTransaction(admin, {
          accountId: card.linked_account_id,
          amount: MASTERCARD_FEE,
          direction: "credit",
          type: "refund",
          description: "Northium Mastercard — application fee refund",
        });
      }

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
        message: `${declineReason} Contact your account officer for follow-up.`,
        category: "transactional",
      });

      const { data: memberProfile } = await admin
        .from("profiles")
        .select("first_name")
        .eq("id", card.member_id)
        .single();

      await sendMemberEmail(
        admin,
        card.member_id,
        buildCardDeclinedEmail({
          firstName: memberProfile?.first_name?.trim() || "Member",
          productName: card.product_name ?? "Northium Mastercard",
          reason: note ?? declineReason,
        })
      );

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
    const deliveryEta = physicalCardDeliveryEta();
    const deliveryEtaLabel = formatDeliveryEtaLabel(deliveryEta);

    const { data: updated, error: updateError } = await admin
      .from("cards")
      .update({
        status: "active",
        last_four: credentials.lastFour,
        pan_encrypted: credentials.panEncrypted,
        cvv_encrypted: credentials.cvvEncrypted,
        expires_at: credentials.expiresAt,
        approved_at: now,
        delivery_eta: deliveryEta,
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

    const approvalMessage =
      note ??
      `Your Northium Mastercard has been approved. Your physical card is being produced and will be mailed to the address on file within 7 to 30 days (estimated ${deliveryEtaLabel}).`;

    await notifyMember(admin, {
      userId: card.member_id,
      title: "Card application approved",
      message: approvalMessage,
      category: "transactional",
    });

    const { data: memberProfile } = await admin
      .from("profiles")
      .select("first_name")
      .eq("id", card.member_id)
      .single();

    await sendMemberEmail(
      admin,
      card.member_id,
      buildCardApprovedEmail({
        firstName: memberProfile?.first_name?.trim() || "Member",
        productName: card.product_name ?? "Northium Mastercard",
        deliveryEtaLabel,
      })
    );

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
