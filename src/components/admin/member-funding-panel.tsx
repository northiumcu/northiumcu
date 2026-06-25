"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AdminActionFeedback,
  type AdminFeedback,
} from "@/components/admin/admin-action-feedback";
import { adminButtonNeutral } from "@/components/admin/admin-button-styles";
import type { MemberAccount } from "@/components/admin/member-admin-types";
import { formatCurrency } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

interface MemberFundingPanelProps {
  accounts: MemberAccount[];
  selectedAccountId: string;
  onAccountChange: (accountId: string) => void;
  onUpdated: () => void;
}

export function MemberFundingPanel({
  accounts,
  selectedAccountId,
  onAccountChange,
  onUpdated,
}: MemberFundingPanelProps) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<AdminFeedback>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");

  async function handleAdjust(direction: "credit" | "debit") {
    if (!selectedAccountId || !adjustAmount) return;
    setBusy(true);
    setFeedback(null);
    const response = await fetch(`/api/admin/accounts/${selectedAccountId}/adjust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        direction,
        amount: Number(adjustAmount),
        description: adjustDescription || undefined,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setFeedback({ type: "error", text: data.error ?? "Adjustment failed." });
      return;
    }

    setFeedback({
      type: "success",
      text: `${direction === "credit" ? "Funded" : "Debited"} ${formatCurrency(adjustAmount)}. New balance: ${formatCurrency(data.balance)}.`,
    });
    setAdjustAmount("");
    onUpdated();
  }

  if (accounts.length === 0) {
    return (
      <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
        <CardContent className="py-8 text-center text-sm text-white/50">
          This member has no accounts to fund.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
      <CardHeader>
        <CardTitle className="font-heading text-lg">Fund / Debit Account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-white/70">Account</Label>
          <select
            value={selectedAccountId}
            onChange={(event) => onAccountChange(event.target.value)}
            className="w-full rounded-xl border border-white/15 bg-[#06121c] px-3 py-2 text-sm"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.type} ••••{account.account_number.slice(-4)} —{" "}
                {formatCurrency(account.available_balance)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label className="text-white/70">Amount</Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={adjustAmount}
            onChange={(event) => setAdjustAmount(event.target.value)}
            className="rounded-xl border-white/15 bg-[#06121c] text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/70">Description (optional)</Label>
          <Input
            value={adjustDescription}
            onChange={(event) => setAdjustDescription(event.target.value)}
            className="rounded-xl border-white/15 bg-[#06121c] text-white"
          />
        </div>
        <div className="flex gap-3">
          <Button
            disabled={busy || !adjustAmount}
            onClick={() => void handleAdjust("credit")}
            className="flex-1 bg-northium-gold text-[#06121c] hover:bg-northium-gold/90"
          >
            Fund (Credit)
          </Button>
          <Button
            disabled={busy || !adjustAmount}
            variant="outline"
            onClick={() => void handleAdjust("debit")}
            className={cn("flex-1", adminButtonNeutral)}
          >
            Debit
          </Button>
        </div>
        <AdminActionFeedback feedback={feedback} />
      </CardContent>
    </Card>
  );
}
