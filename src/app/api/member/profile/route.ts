import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const avatarSchema = z.object({
  avatarUrl: z
    .string()
    .max(600_000)
    .refine(
      (v) => v.startsWith("data:image/"),
      "Avatar must be an image data URL."
    ),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .select(
        "id, email, first_name, last_name, phone, member_number, member_status, avatar_url"
      )
      .eq("id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = avatarSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid avatar image." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("profiles")
      .update({ avatar_url: parsed.data.avatarUrl, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("avatar_url")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ avatarUrl: data?.avatar_url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
