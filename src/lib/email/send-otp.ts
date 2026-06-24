import { institution } from "@/lib/institution";

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

  if (process.env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${institution.shortName} <${institution.supportEmail}>`,
        to: [to],
        subject,
        text: body,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Failed to send OTP email: ${detail}`);
    }
    return;
  }

  console.info(`[Northium OTP] ${purpose} → ${to}: ${code}`);
}
