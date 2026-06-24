import { NextResponse } from "next/server";
import { createMathChallenge } from "@/lib/security/human-check";

export async function GET() {
  try {
    const challenge = createMathChallenge();
    return NextResponse.json(challenge);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create verification.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
