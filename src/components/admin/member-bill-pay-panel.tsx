"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AdminActionFeedback,
  type AdminFeedback,
} from "@/components/admin/admin-action-feedback";
import type { MemberRecord } from "@/components/admin/member-admin-types";

interface MemberBillPayPanelProps {
  selected: MemberRecord;
  onUpdated: () => void;
}

export function MemberBillPayPanel({ selected, onUpdated }: MemberBillPayPanelProps) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<AdminFeedback>(null);
  const [billPayEnabled, setBillPayEnabled] = useState(selected.bill_pay_enabled !== false);

  useEffect(() => {
    setBillPayEnabled(selected.bill_pay_enabled !== false);
  }, [selected.bill_pay_enabled]);

  return (
    <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
      <CardHeader>
        <CardTitle className="font-heading text-lg">Bill Pay</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-white/55">
          When disabled, this member cannot add payees or submit bill payments from the
          member portal.
        </p>
        <Button
          type="button"
          disabled={busy}
          onClick={async () => {
            const next = !billPayEnabled;
            setBillPayEnabled(next);
            setBusy(true);
            setFeedback(null);
            const response = await fetch(`/api/admin/members/${selected.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ billPayEnabled: next }),
            });
            const data = await response.json();
            setBusy(false);

            if (!response.ok) {
              setBillPayEnabled(!next);
              setFeedback({ type: "error", text: data.error ?? "Update failed." });
              return;
            }

            setFeedback({
              type: "success",
              text: next
                ? "Bill Pay is ON for this member."
                : "Bill Pay is OFF for this member.",
            });
            onUpdated();
          }}
          className={
            billPayEnabled
              ? "w-full bg-northium-gold text-[#06121c] hover:bg-northium-gold/90"
              : "w-full bg-red-500/90 text-white hover:bg-red-500"
          }
        >
          {billPayEnabled ? "BILL PAY — ON" : "BILL PAY — OFF"}
        </Button>
        <AdminActionFeedback feedback={feedback} />
      </CardContent>
    </Card>
  );
}
