import { EmailDeliveryError } from "@/lib/email/config";
import {
  getDefaultResendFromEmail,
  getResendFromAddress,
  isEmailDeliveryConfigured,
  resolveResendCredentials,
} from "@/lib/email/resolve-credentials";

export type SendResendEmailInput = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

type ResendErrorBody = {
  message?: string;
  name?: string;
};

function parseResendError(status: number, detail: string): string {
  let message = detail;
  try {
    const parsed = JSON.parse(detail) as ResendErrorBody;
    message = parsed.message ?? detail;
  } catch {
    // keep raw text
  }

  if (
    status === 403 &&
    message.toLowerCase().includes("only send testing emails to your own email")
  ) {
    return (
      "Resend is in test mode. Verify northiumcu.com in Resend and set the sender to helpdesk@northiumcu.com, " +
      "or save your Resend API key under Admin → Settings → Email delivery."
    );
  }

  if (status === 403 && message.toLowerCase().includes("domain")) {
    return (
      "Sender domain is not verified in Resend. Add and verify northiumcu.com at resend.com/domains."
    );
  }

  return `Failed to send email (${status}): ${message}`;
}

export async function sendResendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
}: SendResendEmailInput): Promise<void> {
  const recipients = Array.isArray(to) ? to : [to];
  const credentials = await resolveResendCredentials();

  if (!credentials) {
    if (process.env.NODE_ENV === "production") {
      throw new EmailDeliveryError(
        "Email delivery is not configured. Set RESEND_API_KEY on Vercel or save it in Admin → Settings → Email delivery."
      );
    }
    console.info(
      `[Northium Email] ${subject} → ${recipients.join(", ")}\n${text}`
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: credentials.from,
      to: recipients,
      subject,
      text,
      ...(html ? { html } : {}),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new EmailDeliveryError(parseResendError(response.status, detail));
  }
}

export async function emailDeliveryStatus() {
  const credentials = await resolveResendCredentials();
  return {
    configured: Boolean(credentials),
    source: credentials?.source ?? "none",
    from: credentials?.from ?? getResendFromAddress(),
    defaultFromEmail: getDefaultResendFromEmail(),
    envVarPresent: Boolean(
      process.env.RESEND_API_KEY?.trim() ||
        process.env.RESEND_KEY?.trim() ||
        process.env.RESEND_SECRET?.trim()
    ),
  };
}

export { isEmailDeliveryConfigured };
