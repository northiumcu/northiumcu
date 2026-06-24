import { institution } from "@/lib/institution";

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
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (apiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${institution.shortName} <${institution.supportEmail}>`,
        to: recipients,
        subject,
        text,
        ...(html ? { html } : {}),
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Failed to send email: ${detail}`);
    }
    return;
  }

  console.info(
    `[Northium Email] ${subject} → ${recipients.join(", ")}\n${text}`
  );
}
