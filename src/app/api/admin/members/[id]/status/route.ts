import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { notifyMember } from "@/lib/banking/member-notifications";
import { sendAccountStatusEmail } from "@/lib/email/member-alerts";
import {
  logAdminAction,
  requestAuditContext,
} from "@/lib/audit/log-admin-action";

const statusSchema = z.object({
  memberStatus: z.enum(["active", "paused", "suspended", "applicant"]),
  note: z.string().max(500).optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;
    const { admin } = auth;

    const body = await request.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const { memberStatus, note } = parsed.data;

    const { data, error } = await admin
      .from("profiles")
      .update({
        member_status: memberStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("staff_role", "member")
      .select("id, member_status, first_name, last_name")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Member not found." }, { status: 404 });
    }

    const messages: Record<string, { title: string; message: string }> = {
      paused: {
        title: "Account paused",
        message:
          note ??
          "Your Northium account has been paused. Transfers and changes are disabled until review is complete.",
      },
      suspended: {
        title: "Account suspended",
        message:
          note ??
          "Your Northium account has been suspended. Contact your account officer for assistance.",
      },
      active: {
        title: "Account restored",
        message:
          note ??
          "Your Northium account access has been restored. You may use your account normally.",
      },
      applicant: {
        title: "Account status updated",
        message: note ?? "Your membership application status has been updated.",
      },
    };

    const notification = messages[memberStatus];
    if (notification) {
      await notifyMember(admin, {
        userId: id,
        title: notification.title,
        message: notification.message,
        category: "security",
      });

      if (
        memberStatus === "paused" ||
        memberStatus === "suspended" ||
        memberStatus === "active"
      ) {
        await sendAccountStatusEmail(admin, {
          memberId: id,
          firstName: data.first_name?.trim() || "Member",
          status: memberStatus,
          note,
        });
      }
    }

    const audit = requestAuditContext(request);
    await logAdminAction(admin, {
      actorId: auth.profile.id,
      actorRole: auth.profile.staff_role,
      action: `admin.member.status.${memberStatus}`,
      resourceType: "profile",
      resourceId: id,
      reasonNote: note,
      ipAddress: audit.ipAddress,
      userAgent: audit.userAgent,
    });

    return NextResponse.json({ member: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
