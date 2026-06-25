import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  resolvePostLoginPath,
  STAFF_LOGIN_EMAIL,
} from "@/lib/auth/admin-paths";
import { staffLoginSchema } from "@/lib/auth/validators";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const limited = enforceRateLimit(request, "auth:staff-login", 10, 60_000);
    if (limited) return limited;

    const body = await request.json();
    const parsed = staffLoginSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      return NextResponse.json(
        { error: firstError ?? "Invalid sign-in details." },
        { status: 400 }
      );
    }

    const { email, password, next } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail !== STAFF_LOGIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id, staff_role")
      .eq("email", normalizedEmail)
      .single();

    if (profileError || !profile || profile.staff_role === "member") {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const redirectTo = resolvePostLoginPath(next, true);

    return NextResponse.json({
      redirectTo,
      message: "Signed in successfully.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign in failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
