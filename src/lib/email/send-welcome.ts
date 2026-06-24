import { buildWelcomeMemberEmail } from "@/lib/email/templates/catalog";
import { sendResendEmail } from "@/lib/email/resend";

export async function sendWelcomeMemberEmail({
  to,
  firstName,
}: {
  to: string;
  firstName: string;
}) {
  const message = buildWelcomeMemberEmail(firstName);

  try {
    await sendResendEmail({
      to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  } catch (error) {
    console.error("[Northium Welcome] Email delivery failed:", error);
  }
}
