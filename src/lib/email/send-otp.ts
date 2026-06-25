import {
  buildOtpLoginEmail,
  buildOtpPinResetEmail,
  buildOtpSignupEmail,
} from "@/lib/email/templates/catalog";
import { sendResendEmail } from "@/lib/email/resend";

export type OtpEmailPurpose = "login" | "signup" | "pin_reset";

export async function sendOtpEmail({
  to,
  code,
  purpose,
}: {
  to: string;
  code: string;
  purpose: OtpEmailPurpose;
}) {
  const message =
    purpose === "login"
      ? buildOtpLoginEmail(code)
      : purpose === "signup"
        ? buildOtpSignupEmail(code)
        : buildOtpPinResetEmail(code);

  await sendResendEmail({
    to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
