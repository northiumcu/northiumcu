import { institution } from "@/lib/institution";

type SendResendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
};

export async function sendResendEmail({
  to,
  subject,
  text,
  replyTo,
}: SendResendEmailInput): Promise<void> {
  const recipients = Array.isArray(to) ? to : [to];

  if (process.env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${institution.shortName} <${institution.supportEmail}>`,
        to: recipients,
        subject,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Failed to send email: ${detail}`);
    }
    return;
  }

  console.info(`[Northium Email] ${subject} → ${recipients.join(", ")}\n${text}`);
}
