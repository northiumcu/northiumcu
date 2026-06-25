"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AdminActionFeedback,
  type AdminFeedback,
} from "@/components/admin/admin-action-feedback";
import type { MemberRecord } from "@/components/admin/member-admin-types";

interface MemberDelayTransfersPanelProps {
  selected: MemberRecord;
  onUpdated: () => void;
}

export function MemberDelayTransfersPanel({
  selected,
  onUpdated,
}: MemberDelayTransfersPanelProps) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<AdminFeedback>(null);
  const [delayTransactions, setDelayTransactions] = useState(selected.delay_transactions);

  useEffect(() => {
    setDelayTransactions(selected.delay_transactions);
  }, [selected.delay_transactions]);

  return (
    <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
      <CardHeader>
        <CardTitle className="font-heading text-lg">Delay Transaction Mode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-white/55">
          When enabled, every transfer this member submits requires your approval
          before funds are debited. The member is notified of each decision.
        </p>
        <Button
          type="button"
          disabled={busy}
          onClick={async () => {
            const next = !delayTransactions;
            setDelayTransactions(next);
            setBusy(true);
            setFeedback(null);
            const response = await fetch(`/api/admin/members/${selected.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ delayTransactions: next }),
            });
            const data = await response.json();
            setBusy(false);

            if (!response.ok) {
              setDelayTransactions(!next);
              setFeedback({ type: "error", text: data.error ?? "Update failed." });
              return;
            }

            setFeedback({
              type: "success",
              text: next
                ? "DELAY TRANSACTION is ON for this member."
                : "DELAY TRANSACTION is OFF — transfers process immediately.",
            });
            onUpdated();
          }}
          className={
            delayTransactions
              ? "w-full bg-red-500/90 text-white hover:bg-red-500"
              : "w-full bg-northium-gold text-[#06121c] hover:bg-northium-gold/90"
          }
        >
          {delayTransactions ? "DELAY TRANSACTION — ON" : "DELAY TRANSACTION — OFF"}
        </Button>
        <AdminActionFeedback feedback={feedback} />
      </CardContent>
    </Card>
  );
}
