import {
  buildOtpLoginEmail,
  buildOtpPinResetEmail,
  buildOtpSignupEmail,
} from "@/lib/email/templates/catalog";
import type { EmailRecipientContext } from "@/lib/email/recipient-context";
import { sendResendEmail } from "@/lib/email/resend";

export type OtpEmailPurpose = "login" | "signup" | "pin_reset";

export async function sendOtpEmail({
  to,
  code,
  purpose,
  firstName,
  username,
}: {
  to: string;
  code: string;
  purpose: OtpEmailPurpose;
  firstName?: string | null;
  username?: string | null;
}) {
  const context: EmailRecipientContext = { firstName, username };
  const message =
    purpose === "login"
      ? buildOtpLoginEmail(code, context)
      : purpose === "signup"
        ? buildOtpSignupEmail(code, context)
        : buildOtpPinResetEmail(code, context);

  await sendResendEmail({
    to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
