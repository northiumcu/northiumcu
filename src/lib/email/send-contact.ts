import { institution } from "@/lib/institution";
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
  const topicLabel = TOPIC_LABELS[submission.topic] ?? submission.topic;
  const submittedAt = new Date().toISOString();

  const body = `New contact form submission on ${institution.domain}

Submitted: ${submittedAt}

Name: ${submission.name}
Email: ${submission.email}
Topic: ${topicLabel}

Message:
${submission.message}

---
Reply directly to ${submission.email} when responding.`;

  await sendResendEmail({
    to: institution.supportEmail,
    replyTo: submission.email,
    subject: `[Contact] ${topicLabel} — ${submission.name}`,
    text: body,
  });
}
