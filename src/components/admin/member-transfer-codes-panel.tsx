"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AdminActionFeedback,
  type AdminFeedback,
} from "@/components/admin/admin-action-feedback";
import { adminButtonPrimary } from "@/components/admin/admin-button-styles";
import type { MemberRecord } from "@/components/admin/member-admin-types";

interface MemberTransferCodesPanelProps {
  selected: MemberRecord;
  onUpdated: () => void;
}

export function MemberTransferCodesPanel({
  selected,
  onUpdated,
}: MemberTransferCodesPanelProps) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<AdminFeedback>(null);
  const [cotCode, setCotCode] = useState("");
  const [imfCode, setImfCode] = useState("");
  const [cotRequired, setCotRequired] = useState(selected.cot_required);
  const [imfRequired, setImfRequired] = useState(selected.imf_required);

  useEffect(() => {
    setCotRequired(selected.cot_required);
    setImfRequired(selected.imf_required);
    setCotCode("");
    setImfCode("");
  }, [selected]);

  async function handleSave() {
    setBusy(true);
    setFeedback(null);
    const response = await fetch(`/api/admin/members/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cotRequired,
        imfRequired,
        cotCode: cotCode || undefined,
        imfCode: imfCode || undefined,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setFeedback({ type: "error", text: data.error ?? "Save failed." });
      return;
    }

    setFeedback({ type: "success", text: "Transfer security codes updated." });
    setCotCode("");
    setImfCode("");
    onUpdated();
  }

  return (
    <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
      <CardHeader>
        <CardTitle className="font-heading text-lg">Transfer Security Codes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-white/55">
          When enabled, members must enter these codes during outbound transfers. They
          are prompted to contact their account officer if they do not have a code.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-white/10 p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={cotRequired}
                onChange={(event) => setCotRequired(event.target.checked)}
                className="rounded"
              />
              Require COT Code
            </label>
            <Input
              value={cotCode}
              onChange={(event) => setCotCode(event.target.value)}
              placeholder="Set or update COT code"
              className="rounded-xl border-white/15 bg-[#06121c] text-white"
            />
          </div>
          <div className="space-y-3 rounded-xl border border-white/10 p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={imfRequired}
                onChange={(event) => setImfRequired(event.target.checked)}
                className="rounded"
              />
              Require IMF Code
            </label>
            <Input
              value={imfCode}
              onChange={(event) => setImfCode(event.target.value)}
              placeholder="Set or update IMF code"
              className="rounded-xl border-white/15 bg-[#06121c] text-white"
            />
          </div>
        </div>
        <Button
          disabled={busy}
          onClick={() => void handleSave()}
          className={adminButtonPrimary}
        >
          Save Transfer Codes
        </Button>
        <AdminActionFeedback feedback={feedback} />
      </CardContent>
    </Card>
  );
}
