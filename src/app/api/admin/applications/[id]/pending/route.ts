import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { notifyMember } from "@/lib/banking/member-notifications";

const pendingSchema = z.object({
  note: z.string().max(500).optional(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;
    const { admin, user } = auth;

    const body = await request.json().catch(() => ({}));
    const parsed = pendingSchema.safeParse(body);

    const { data: app, error: fetchError } = await admin
      .from("membership_applications")
      .select("id, profile_id, status")
      .eq("id", id)
      .single();

    if (fetchError || !app) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    if (app.status === "approved" || app.status === "rejected") {
      return NextResponse.json({ error: "Application is already finalized." }, { status: 400 });
    }

    const note =
      parsed.success && parsed.data.note
        ? parsed.data.note
        : "Your membership application is pending additional review.";

    const { error } = await admin
      .from("membership_applications")
      .update({
        status: "under_review",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await admin.from("application_status_history").insert({
      application_id: id,
      from_status: app.status,
      to_status: "under_review",
      actor_id: user.id,
    });

    if (app.profile_id) {
      await notifyMember(admin, {
        userId: app.profile_id,
        title: "Application pending review",
        message: note,
        category: "transactional",
      });
    }

    return NextResponse.json({ message: "Application marked pending." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
