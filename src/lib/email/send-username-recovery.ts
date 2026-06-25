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
}) {
  const message = buildUsernameRecoveryEmail({ firstName, username });

  await sendResendEmail({
    to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
