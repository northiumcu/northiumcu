import {
  buildOtpLoginEmail,
  buildOtpSignupEmail,
} from "@/lib/email/templates/catalog";
import { sendResendEmail } from "@/lib/email/resend";

export async function sendOtpEmail({
  to,
  code,
  purpose,
}: {
  to: string;
  code: string;
  purpose: "login" | "signup";
}) {
  const message =
    purpose === "login"
      ? buildOtpLoginEmail(code)
      : buildOtpSignupEmail(code);

  try {
    await sendResendEmail({
      to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  } catch (error) {
    console.error("[Northium OTP] Email delivery failed:", error);
    console.info(`[Northium OTP] ${purpose} → ${to}: ${code}`);
  }
}
