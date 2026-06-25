import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveSignupStatus } from "@/lib/auth/signup-session";
import { signupStatusSchema } from "@/lib/auth/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = signupStatusSchema.safeParse({
      email: searchParams.get("email") ?? "",
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const admin = createAdminClient();
    const status = await resolveSignupStatus(admin, parsed.data.email);
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load signup status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
