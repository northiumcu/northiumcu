import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSensitive } from "@/lib/auth/crypto";
import { changePasswordSchema } from "@/lib/auth/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      return NextResponse.json(
        { error: firstError ?? "Invalid password details." },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;
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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("staff_role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.staff_role === "member") {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (verifyError) {
      return NextResponse.json(
        { error: "Current password is incorrect." },
        { status: 401 }
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
      data: { password_change_required: false },
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await admin
      .from("profiles")
      .update({ internal_auth_secret: encryptSensitive(newPassword) })
      .eq("id", user.id);

    return NextResponse.json({
      message: "Password updated successfully.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Password update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
