"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminActionFeedback } from "@/components/admin/admin-action-feedback";
import type { MemberRecord } from "@/components/admin/member-admin-types";

interface MemberSelectorCardProps {
  members: MemberRecord[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading?: boolean;
  loadError?: string | null;
  selected?: MemberRecord | null;
}

export function MemberSelectorCard({
  members,
  selectedId,
  onSelect,
  loading = false,
  loadError = null,
  selected = null,
}: MemberSelectorCardProps) {
  return (
    <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
      <CardHeader>
        <CardTitle className="font-heading text-lg text-white">Select Member</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-white/50">Loading members...</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-white/50">
            No members yet. Create one under Create Member or approve an application
            from Members.
          </p>
        ) : (
          <>
            <select
              value={selectedId}
              onChange={(event) => onSelect(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#06121c] px-3 py-2.5 text-sm text-white"
            >
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.first_name} {member.last_name} — {member.email}
                </option>
              ))}
            </select>
            {selected && (
              <div className="flex flex-wrap gap-2">
                <Badge
                  className={
                    selected.member_status === "paused"
                      ? "bg-amber-500/20 text-amber-200"
                      : selected.member_status === "suspended"
                        ? "bg-red-500/20 text-red-200"
                        : "bg-white/10 text-white/80"
                  }
                >
                  {selected.member_status}
                </Badge>
                {selected.member_number && (
                  <Badge className="bg-northium-gold/20 text-northium-gold">
                    Acct {selected.member_number}
                  </Badge>
                )}
                {selected.cot_required && (
                  <Badge className="bg-white/10 text-white/70">
                    COT {selected.has_cot_code ? "configured" : "needs code"}
                  </Badge>
                )}
                {selected.imf_required && (
                  <Badge className="bg-white/10 text-white/70">
                    IMF {selected.has_imf_code ? "configured" : "needs code"}
                  </Badge>
                )}
                {selected.delay_transactions && (
                  <Badge className="bg-amber-500/20 text-amber-200">Delay ON</Badge>
                )}
                {selected.pause_transfers && (
                  <Badge className="bg-red-500/20 text-red-200">Pause ON</Badge>
                )}
                {selected.bill_pay_enabled === false && (
                  <Badge className="bg-red-500/20 text-red-200">Bill Pay OFF</Badge>
                )}
              </div>
            )}
          </>
        )}
        <AdminActionFeedback
          feedback={loadError ? { type: "error", text: loadError } : null}
        />
      </CardContent>
    </Card>
  );
}
