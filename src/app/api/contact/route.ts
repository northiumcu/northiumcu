import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/auth/validators";
import { sendContactNotification } from "@/lib/email/send-contact";
import { verifyMathChallenge } from "@/lib/security/human-check";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      return NextResponse.json(
        { error: firstError ?? "Invalid form submission." },
        { status: 400 }
      );
    }

    const { humanCheckToken, humanCheckAnswer, ...submission } = parsed.data;

    if (!verifyMathChallenge(humanCheckToken, humanCheckAnswer)) {
      return NextResponse.json(
        { error: "Incorrect verification answer. Please try again." },
        { status: 400 }
      );
    }

    await sendContactNotification(submission);

    return NextResponse.json({ message: "Message sent successfully." });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send message.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
