import { NextResponse } from "next/server";
import { z } from "zod";
import {
  requireActiveMemberWrite,
  requireAuthenticatedMember,
} from "@/lib/auth/require-member";

const profileUpdateSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().min(7).max(20).optional().nullable(),
  avatarUrl: z
    .string()
    .max(600_000)
    .refine((v) => v.startsWith("data:image/"), "Avatar must be an image.")
    .optional(),
});

export async function GET() {
  try {
    const auth = await requireAuthenticatedMember();
    if ("error" in auth) return auth.error;

    const { data, error } = await auth.admin
      .from("profiles")
      .select(
        "id, email, first_name, last_name, phone, member_number, member_status, avatar_url"
      )
      .eq("id", auth.user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    return NextResponse.json({
      profile: data,
      paused: data.member_status === "paused",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireActiveMemberWrite();
    if ("error" in auth) return auth.error;

    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      return NextResponse.json({ error: firstError ?? "Invalid profile." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.firstName !== undefined) updates.first_name = parsed.data.firstName;
    if (parsed.data.lastName !== undefined) updates.last_name = parsed.data.lastName;
    if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
    if (parsed.data.avatarUrl !== undefined) updates.avatar_url = parsed.data.avatarUrl;

    const { data, error } = await auth.admin
      .from("profiles")
      .update(updates)
      .eq("id", auth.user.id)
      .select(
        "id, email, first_name, last_name, phone, member_number, member_status, avatar_url"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
