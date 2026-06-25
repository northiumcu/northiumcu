import { institution } from "@/lib/institution";
import { escapeHtml } from "@/lib/email/escape";
import {
  buildEmailLayout,
  detailRow,
} from "@/lib/email/templates/layout";

type EmailPayload = {
  subject: string;
  text: string;
  html: string;
};

const portalCardsUrl = `${institution.productionUrl}/member/cards`;

export function formatCardDeclineReason(adminReason: string): string {
  const trimmed = adminReason.trim().replace(/\s+/g, " ");
  if (!trimmed) {
    return "Your application did not meet our current card issuance requirements.";
  }

  const normalized =
    trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
}

export function buildCardApprovedEmail(input: {
  firstName: string;
  productName: string;
  deliveryEtaLabel: string;
}): EmailPayload {
  const safeFirst = escapeHtml(input.firstName);
  const safeProduct = escapeHtml(input.productName);
  const safeEta = escapeHtml(input.deliveryEtaLabel);
  const subject = `Your ${input.productName} application is approved`;
  const body = `Your ${input.productName} application has been approved. Your card is now being produced and will be mailed to the address on file. Physical delivery typically takes 7 to 30 days (${input.deliveryEtaLabel}). You can sign in to view your digital card credentials while you wait.`;

  const text = `Hello ${input.firstName},

${body}

View your card: ${portalCardsUrl}

Questions? Contact your Northium account officer at ${institution.supportEmail}.

${institution.name}`;

  const html = buildEmailLayout({
    preheader: "Your card application was approved and is being mailed to you.",
    eyebrow: "Card application",
    title: "Application approved",
    bodyHtml: `<p style="margin:0 0 16px">Hello ${safeFirst},</p>
      <p style="margin:0 0 16px">Your <strong>${safeProduct}</strong> application has been approved.</p>
      <p style="margin:0 0 16px">Your card is being produced and will be mailed to the <strong>address on file</strong>. Physical delivery typically takes <strong>7 to 30 days</strong>.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px">
        ${detailRow("Estimated arrival", safeEta)}
        ${detailRow("Digital access", "Available now in your member portal")}
      </table>
      <p style="margin:0;font-size:14px;color:#667085">You may view your digital card number and security code in Cards after signing in with your account PIN.</p>`,
    cta: { label: "View my card", href: portalCardsUrl },
    footerNote:
      "If your mailing address has changed, contact your account officer before your card ships.",
  });

  return { subject, text, html };
}

export function buildCardDeclinedEmail(input: {
  firstName: string;
  productName: string;
  reason: string;
}): EmailPayload {
  const formattedReason = formatCardDeclineReason(input.reason);
  const safeFirst = escapeHtml(input.firstName);
  const safeProduct = escapeHtml(input.productName);
  const subject = `Update on your ${input.productName} application`;

  const text = `Hello ${input.firstName},

Thank you for applying for the ${input.productName}. After review, we were unable to approve your application at this time.

Reason: ${formattedReason}

Any application fee charged to your account has been refunded. Please contact your Northium account officer for follow-up and to discuss next steps.

${institution.supportEmail}

${institution.name}`;

  const html = buildEmailLayout({
    preheader: "Your card application was not approved.",
    eyebrow: "Card application",
    title: "Application not approved",
    bodyHtml: `<p style="margin:0 0 16px">Hello ${safeFirst},</p>
      <p style="margin:0 0 16px">Thank you for applying for the <strong>${safeProduct}</strong>. After review, we were unable to approve your application at this time.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 20px">
        ${detailRow("Reason", formattedReason)}
        ${detailRow("Application fee", "Refunded to your linked account")}
      </table>
      <p style="margin:0">Please contact your <strong>Northium account officer</strong> for follow-up and to discuss next steps.</p>`,
    cta: {
      label: "Contact support",
      href: `mailto:${institution.supportEmail}`,
    },
    footerNote: "Our team can review your application and advise on eligibility or documentation.",
  });

  return { subject, text, html };
}

export function physicalCardDeliveryEta(): string {
  const days = 7 + Math.floor(Math.random() * 24);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatDeliveryEtaLabel(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
