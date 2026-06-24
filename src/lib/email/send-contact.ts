import { institution } from "@/lib/institution";
import {
  buildContactConfirmationEmail,
  buildContactInternalEmail,
} from "@/lib/email/templates/catalog";
import { sendResendEmail } from "@/lib/email/resend";

const TOPIC_LABELS: Record<string, string> = {
  general: "General inquiry",
  account: "Account support",
  membership: "Membership",
  loans: "Loans",
  security: "Security / fraud",
};

export type ContactSubmission = {
  name: string;
  email: string;
  topic: keyof typeof TOPIC_LABELS;
  message: string;
};

export async function sendContactNotification(submission: ContactSubmission) {
  const internal = buildContactInternalEmail(submission);
  const confirmation = buildContactConfirmationEmail({
    name: submission.name,
    topic: submission.topic,
  });

  await sendResendEmail({
    to: institution.supportEmail,
    replyTo: submission.email,
    subject: internal.subject,
    text: internal.text,
    html: internal.html,
  });

  try {
    await sendResendEmail({
      to: submission.email,
      subject: confirmation.subject,
      text: confirmation.text,
      html: confirmation.html,
    });
  } catch (error) {
    console.error("[Northium Contact] Confirmation email failed:", error);
  }
}
