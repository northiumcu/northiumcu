import { buildUsernameRecoveryEmail } from "@/lib/email/templates/catalog";
import { sendResendEmail } from "@/lib/email/resend";

export async function sendUsernameRecoveryEmail({
  to,
  firstName,
  username,
}: {
  to: string;
  firstName: string;
  username: string;
}): Promise<string> {
  const message = buildUsernameRecoveryEmail({ firstName, username });

  return sendResendEmail({
    to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
