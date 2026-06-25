import {
  assertEmailDeliveryConfigured,
  EmailDeliveryError,
  getResendFromAddress,
  isEmailConfigured,
} from "@/lib/email/config";

export type SendResendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export async function sendResendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
}: SendResendEmailInput): Promise<void> {
  const recipients = Array.isArray(to) ? to : [to];
  assertEmailDeliveryConfigured();

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info(
      `[Northium Email] ${subject} → ${recipients.join(", ")}\n${text}`
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getResendFromAddress(),
      to: recipients,
      subject,
      text,
      ...(html ? { html } : {}),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new EmailDeliveryError(`Failed to send email: ${detail}`);
  }
}

export function emailDeliveryStatus() {
  return {
    configured: isEmailConfigured(),
    from: getResendFromAddress(),
  };
}
