import type { AuditLog } from "@/types/database";

export interface AuditRecordInput {
  actorId: string | null;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  reasonCode?: string | null;
  reasonNote?: string | null;
  stateBefore?: Record<string, unknown> | null;
  stateAfter?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  channel?: string;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
}

export function buildAuditRecord(
  input: AuditRecordInput
): Omit<AuditLog, "id" | "created_at"> {
  return {
    actor_id: input.actorId,
    actor_role: input.actorRole,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId ?? null,
    reason_code: input.reasonCode ?? null,
    reason_note: input.reasonNote ?? null,
    state_before: input.stateBefore ?? null,
    state_after: input.stateAfter ?? null,
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
    channel: input.channel ?? "system",
    correlation_id: input.correlationId ?? null,
    metadata: input.metadata ?? {},
  };
}
