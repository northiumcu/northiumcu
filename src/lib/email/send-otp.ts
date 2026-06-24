import { institution } from "@/lib/institution";
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
  const subject =
    purpose === "login"
      ? `${institution.shortName} sign-in verification code`
      : `${institution.shortName} membership verification code`;

  const body = `Your Northium verification code is: ${code}

This code expires in 10 minutes. If you did not request this, contact ${institution.supportEmail} immediately.

${institution.name}
${institution.tagline}`;

  try {
    await sendResendEmail({ to, subject, text: body });
  } catch (error) {
    console.error("[Northium OTP] Email delivery failed:", error);
    console.info(`[Northium OTP] ${purpose} → ${to}: ${code}`);
  }
}
