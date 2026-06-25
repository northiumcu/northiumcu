import type { SupabaseClient } from "@supabase/supabase-js";
import { institution } from "@/lib/institution";
import { formatCurrency } from "@/lib/format/currency";
import {
  buildEmailLayout,
  detailRow,
} from "@/lib/email/templates/layout";
import { sendResendEmail } from "@/lib/email/resend";

type EmailPayload = {
  subject: string;
  text: string;
  html: string;
};

const portalUrl = `${institution.productionUrl}/member`;

function formatPostedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Chicago",
  });
}

export function buildPostedTransactionEmail(input: {
  firstName: string;
  direction: "credit" | "debit";
  amount: number;
  description: string;
  accountLastFour: string;
  postedAt: string;
}): EmailPayload {
  const action = input.direction === "credit" ? "Credit" : "Debit";
  const subject = `${action} on your Northium account`;
  const amountLabel = formatCurrency(input.amount);
  const postedLabel = formatPostedAt(input.postedAt);

  const text = `Hello ${input.firstName},

A ${input.direction} was posted on your Northium account ending in ${input.accountLastFour}.

Amount: ${amountLabel}
Description: ${input.description}
Posted: ${postedLabel}

Sign in to review activity: ${portalUrl}

If you did not authorize this activity, contact ${institution.supportEmail} immediately.

${institution.name}`;

  const html = buildEmailLayout({
    preheader: `${action} of ${amountLabel} on account ••••${input.accountLastFour}`,
    eyebrow: "Account activity",
    title: `${action} posted`,
    bodyHtml: `<p style="margin:0 0 16px">Hello ${input.firstName},</p>
      <p style="margin:0 0 16px">A ${input.direction} was posted on your account ending in <strong>••••${input.accountLastFour}</strong>.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px">
        ${detailRow("Amount", amountLabel)}
        ${detailRow("Description", input.description)}
        ${detailRow("Posted", postedLabel)}
      </table>`,
    cta: { label: "View account", href: portalUrl },
    footerNote:
      "If you did not authorize this activity, contact us immediately. Never share your PIN or verification codes.",
  });

  return { subject, text, html };
}

export function buildTransferStatusEmail(input: {
  firstName: string;
  status: "completed" | "pending" | "approved" | "declined" | "delayed";
  transferType: string;
  amount: number;
  receiver?: string;
  note?: string;
}): EmailPayload {
  const typeLabel = input.transferType.replace(/_/g, " ");
  const amountLabel = formatCurrency(input.amount);
  const receiverLine = input.receiver ? `Receiver: ${input.receiver}\n` : "";

  const titles: Record<typeof input.status, string> = {
    completed: "Transfer completed",
    pending: "Transfer pending review",
    approved: "Transfer approved",
    declined: "Transfer declined",
    delayed: "Transfer delayed",
  };

  const bodies: Record<typeof input.status, string> = {
    completed: `Your ${typeLabel} of ${amountLabel} was processed successfully.`,
    pending: `Your ${typeLabel} of ${amountLabel} is awaiting administrator review.`,
    approved: `Your ${typeLabel} of ${amountLabel} has been approved and processed.`,
    declined: `Your ${typeLabel} of ${amountLabel} was not approved.`,
    delayed: `Your ${typeLabel} of ${amountLabel} has been delayed for additional review.`,
  };

  const subject = `${titles[input.status]} — ${institution.shortName}`;
  const noteBlock = input.note ? `\n\nNote: ${input.note}` : "";
  const text = `Hello ${input.firstName},

${bodies[input.status]}
${receiverLine}${noteBlock}

Sign in to review transfers: ${portalUrl}/transfers

${institution.name}`;

  const html = buildEmailLayout({
    preheader: bodies[input.status],
    eyebrow: "Transfer update",
    title: titles[input.status],
    bodyHtml: `<p style="margin:0 0 16px">Hello ${input.firstName},</p>
      <p style="margin:0 0 16px">${bodies[input.status]}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px">
        ${detailRow("Type", typeLabel)}
        ${detailRow("Amount", amountLabel)}
        ${input.receiver ? detailRow("Receiver", input.receiver) : ""}
        ${input.note ? detailRow("Note", input.note) : ""}
      </table>`,
    cta: { label: "View transfers", href: `${portalUrl}/transfers` },
    footerNote:
      "If you did not initiate this transfer, contact us immediately.",
  });

  return { subject, text, html };
}

export function buildAccountStatusEmail(input: {
  firstName: string;
  status: "paused" | "suspended" | "active";
  note?: string;
}): EmailPayload {
  const titles: Record<typeof input.status, string> = {
    paused: "Account paused",
    suspended: "Account suspended",
    active: "Account access restored",
  };

  const defaults: Record<typeof input.status, string> = {
    paused:
      "Your Northium account has been paused. Transfers and certain changes are disabled until review is complete.",
    suspended:
      "Your Northium account has been suspended. Contact your account officer for assistance.",
    active:
      "Your Northium account access has been restored. You may use your account normally.",
  };

  const message = input.note?.trim() || defaults[input.status];
  const subject = `${titles[input.status]} — ${institution.shortName}`;

  const text = `Hello ${input.firstName},

${message}

Sign in: ${portalUrl}

Questions? ${institution.supportEmail}

${institution.name}`;

  const html = buildEmailLayout({
    preheader: message,
    eyebrow: "Account status",
    title: titles[input.status],
    bodyHtml: `<p style="margin:0 0 16px">Hello ${input.firstName},</p>
      <p style="margin:0 0 16px">${message}</p>`,
    cta: { label: "Sign in to portal", href: portalUrl },
    footerNote: "If you have questions about this change, contact your account officer.",
  });

  return { subject, text, html };
}

async function resolveMemberEmail(
  admin: SupabaseClient,
  userId: string
): Promise<{ email: string; firstName: string } | null> {
  const { data, error } = await admin
    .from("profiles")
    .select("email, first_name")
    .eq("id", userId)
    .single();

  let email = data?.email?.trim().toLowerCase() ?? "";
  const firstName = data?.first_name?.trim() || "Member";

  if ((!email || !email.includes("@")) && !error) {
    const { data: authUser, error: authError } =
      await admin.auth.admin.getUserById(userId);
    if (!authError && authUser?.user?.email) {
      email = authUser.user.email.trim().toLowerCase();
    }
  }

  if (!email || !email.includes("@")) {
    console.error(
      `[Northium Alert] No deliverable email for member ${userId}.`
    );
    return null;
  }

  return { email, firstName };
}

function logEmailDeliveryError(context: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown email error.";
  console.error(`[Northium Alert] ${context}: ${message}`);
}

/** Awaited delivery — must complete before the serverless handler returns. */
export async function sendMemberEmail(
  admin: SupabaseClient,
  userId: string,
  payload: EmailPayload
): Promise<boolean> {
  try {
    const member = await resolveMemberEmail(admin, userId);
    if (!member) return false;

    await sendResendEmail({
      to: member.email,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
    return true;
  } catch (error) {
    logEmailDeliveryError(`Member email delivery failed for ${userId}`, error);
    return false;
  }
}

export async function sendPostedTransactionEmail(
  admin: SupabaseClient,
  input: {
    memberId: string;
    firstName: string;
    accountLastFour: string;
    direction: "credit" | "debit";
    amount: number;
    description: string;
    postedAt: string;
  }
) {
  const payload = buildPostedTransactionEmail({
    firstName: input.firstName,
    direction: input.direction,
    amount: input.amount,
    description: input.description,
    accountLastFour: input.accountLastFour,
    postedAt: input.postedAt,
  });
  return sendMemberEmail(admin, input.memberId, payload);
}

export async function sendTransferStatusEmail(
  admin: SupabaseClient,
  input: {
    memberId: string;
    firstName: string;
    status: "completed" | "pending" | "approved" | "declined" | "delayed";
    transferType: string;
    amount: number;
    receiver?: string;
    note?: string;
  }
) {
  const payload = buildTransferStatusEmail({
    firstName: input.firstName,
    status: input.status,
    transferType: input.transferType,
    amount: input.amount,
    receiver: input.receiver,
    note: input.note,
  });
  return sendMemberEmail(admin, input.memberId, payload);
}

export async function sendAccountStatusEmail(
  admin: SupabaseClient,
  input: {
    memberId: string;
    firstName: string;
    status: "paused" | "suspended" | "active";
    note?: string;
  }
) {
  const payload = buildAccountStatusEmail({
    firstName: input.firstName,
    status: input.status,
    note: input.note,
  });
  return sendMemberEmail(admin, input.memberId, payload);
}
