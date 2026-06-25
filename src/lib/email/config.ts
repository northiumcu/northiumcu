import { institution } from "@/lib/institution";

export class EmailDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function getResendFromAddress(): string {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (configured) {
    return `${institution.shortName} <${configured}>`;
  }

  // Resend sandbox sender — works before custom domain verification.
  return `${institution.shortName} <onboarding@resend.dev>`;
}

export function assertEmailDeliveryConfigured(): void {
  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new EmailDeliveryError(
        "Email delivery is not configured. Set RESEND_API_KEY on the server."
      );
    }
    console.warn(
      "[Northium Email] RESEND_API_KEY is missing — emails will be logged only."
    );
  }
}
