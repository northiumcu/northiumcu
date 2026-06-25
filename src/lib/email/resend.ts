import { EmailDeliveryError } from "@/lib/email/config";
import { institution } from "@/lib/institution";
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

type ResendDomainRecord = {
  name: string;
  status: string;
};

export type ResendConnectionStatus = {
  apiReachable: boolean;
  fromDomain: string | null;
  fromDomainVerified: boolean;
  domains: ResendDomainRecord[];
  error?: string;
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

function extractFromEmail(from: string): string | null {
  const bracketMatch = from.match(/<([^>]+)>/);
  const email = (bracketMatch?.[1] ?? from).trim().toLowerCase();
  return email.includes("@") ? email : null;
}

export async function verifyResendConnection(): Promise<ResendConnectionStatus> {
  const credentials = await resolveResendCredentials();
  const fromEmail = credentials ? extractFromEmail(credentials.from) : null;
  const fromDomain = fromEmail?.split("@")[1] ?? null;

  if (!credentials) {
    return {
      apiReachable: false,
      fromDomain,
      fromDomainVerified: false,
      domains: [],
      error: "Email delivery credentials are not configured.",
    };
  }

  const response = await fetch("https://api.resend.com/domains", {
    headers: {
      Authorization: `Bearer ${credentials.apiKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const detail = await response.text();
    return {
      apiReachable: false,
      fromDomain,
      fromDomainVerified: false,
      domains: [],
      error: parseResendError(response.status, detail),
    };
  }

  const payload = (await response.json()) as {
    data?: ResendDomainRecord[];
  };
  const domains = payload.data ?? [];
  const fromDomainVerified = fromDomain
    ? domains.some(
        (domain) =>
          domain.name.toLowerCase() === fromDomain &&
          domain.status.toLowerCase() === "verified"
      )
    : false;

  return {
    apiReachable: true,
    fromDomain,
    fromDomainVerified,
    domains: domains.map((domain) => ({
      name: domain.name,
      status: domain.status,
    })),
  };
}

export async function sendResendEmail({
  to,
  subject,
  text,
  html,
  replyTo,
}: SendResendEmailInput): Promise<string> {
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
    return "dev-logged";
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
      reply_to: replyTo ?? institution.supportEmail,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new EmailDeliveryError(parseResendError(response.status, detail));
  }

  let payload: { id?: string };
  try {
    payload = (await response.json()) as { id?: string };
  } catch {
    throw new EmailDeliveryError("Email provider returned an invalid response.");
  }

  if (!payload.id) {
    throw new EmailDeliveryError(
      "Email provider accepted the request but did not return a message id."
    );
  }

  return payload.id;
}

export async function emailDeliveryStatus() {
  const credentials = await resolveResendCredentials();
  let resend: ResendConnectionStatus | null = null;

  if (credentials) {
    try {
      resend = await verifyResendConnection();
    } catch (error) {
      resend = {
        apiReachable: false,
        fromDomain: extractFromEmail(credentials.from)?.split("@")[1] ?? null,
        fromDomainVerified: false,
        domains: [],
        error:
          error instanceof Error
            ? error.message
            : "Could not verify Resend connection.",
      };
    }
  }

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
    resend,
  };
}

export { isEmailDeliveryConfigured };
