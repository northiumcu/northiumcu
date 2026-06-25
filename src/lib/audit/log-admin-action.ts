import type { SupabaseClient } from "@supabase/supabase-js";

type AuditInput = {
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  reasonNote?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  channel?: string;
};

export function requestAuditContext(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ipAddress =
    forwarded?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null;
  const userAgent = request.headers.get("user-agent");
  return { ipAddress, userAgent };
}

export async function logAdminAction(
  admin: SupabaseClient,
  input: AuditInput
) {
  const { error } = await admin.from("audit_logs").insert({
    actor_id: input.actorId,
    actor_role: input.actorRole,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId ?? null,
    reason_note: input.reasonNote ?? null,
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
    channel: input.channel ?? "admin_console",
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("audit log failed:", error.message);
  }
}
