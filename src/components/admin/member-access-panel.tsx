"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AdminActionFeedback,
  type AdminFeedback,
} from "@/components/admin/admin-action-feedback";
import {
  adminButtonDanger,
  adminButtonPrimary,
  adminButtonWarning,
} from "@/components/admin/admin-button-styles";
import type { MemberRecord } from "@/components/admin/member-admin-types";

interface MemberAccessPanelProps {
  selected: MemberRecord;
  onUpdated: () => void;
}

export function MemberAccessPanel({ selected, onUpdated }: MemberAccessPanelProps) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<AdminFeedback>(null);

  const updateMemberStatus = useCallback(
    async (memberStatus: "active" | "paused" | "suspended") => {
      const labels = {
        active: "restore full access for",
        paused: "pause",
        suspended: "suspend",
      };
      const confirmed = window.confirm(
        `Are you sure you want to ${labels[memberStatus]} ${selected.first_name} ${selected.last_name}?`
      );
      if (!confirmed) return;

      setBusy(true);
      setFeedback(null);
      const response = await fetch(`/api/admin/members/${selected.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberStatus }),
      });
      const data = await response.json();
      setBusy(false);

      if (!response.ok) {
        setFeedback({ type: "error", text: data.error ?? "Status update failed." });
        return;
      }

      setFeedback({
        type: "success",
        text:
          memberStatus === "active"
            ? "Member access restored."
            : memberStatus === "paused"
              ? "Member account paused — they can sign in but cannot transfer or edit."
              : "Member account suspended — sign-in will be blocked.",
      });
      onUpdated();
    },
    [onUpdated, selected.first_name, selected.id, selected.last_name]
  );

  return (
    <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
      <CardHeader>
        <CardTitle className="font-heading text-lg text-white">Account Access</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-white/55">
          <strong className="text-white/80">Pause</strong> — member can sign in but
          cannot transfer or edit their profile.{" "}
          <strong className="text-white/80">Suspend</strong> — sign-in is blocked with
          a message to contact their account officer.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={busy || selected.member_status === "paused"}
            variant="outline"
            onClick={() => void updateMemberStatus("paused")}
            className={adminButtonWarning}
          >
            Pause Account
          </Button>
          <Button
            disabled={busy || selected.member_status === "suspended"}
            variant="outline"
            onClick={() => void updateMemberStatus("suspended")}
            className={adminButtonDanger}
          >
            Suspend Account
          </Button>
          <Button
            disabled={
              busy ||
              (selected.member_status !== "paused" &&
                selected.member_status !== "suspended")
            }
            onClick={() => void updateMemberStatus("active")}
            className={adminButtonPrimary}
          >
            Restore Access
          </Button>
        </div>
        <AdminActionFeedback feedback={feedback} />
      </CardContent>
    </Card>
  );
}
