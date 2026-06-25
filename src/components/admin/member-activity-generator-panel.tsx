"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AdminActionFeedback,
  type AdminFeedback,
} from "@/components/admin/admin-action-feedback";
import {
  US_STATES,
  type MemberAccount,
  type MemberRecord,
} from "@/components/admin/member-admin-types";
import {
  defaultActivityPeriod,
  defaultPayrollSettings,
  PAYROLL_FREQUENCY_OPTIONS,
  payrollFrequencyLabel,
} from "@/lib/banking/generate-member-transactions";
import { formatCurrency } from "@/lib/format/currency";

interface MemberActivityGeneratorPanelProps {
  selected: MemberRecord;
  accounts: MemberAccount[];
  selectedAccountId: string;
  onAccountChange: (accountId: string) => void;
  onUpdated: () => void;
}

export function MemberActivityGeneratorPanel({
  selected,
  accounts,
  selectedAccountId,
  onAccountChange,
  onUpdated,
}: MemberActivityGeneratorPanelProps) {
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<AdminFeedback>(null);
  const [employerCompanyName, setEmployerCompanyName] = useState("");
  const [addressState, setAddressState] = useState("TX");
  const [debitCount, setDebitCount] = useState("12");
  const [creditCount, setCreditCount] = useState("8");
  const [periodStart, setPeriodStart] = useState(() => defaultActivityPeriod().periodStart);
  const [periodEnd, setPeriodEnd] = useState(() => defaultActivityPeriod().periodEnd);
  const [payrollMinAmount, setPayrollMinAmount] = useState(
    () => String(defaultPayrollSettings().minAmount)
  );
  const [payrollMaxAmount, setPayrollMaxAmount] = useState(
    () => String(defaultPayrollSettings().maxAmount)
  );
  const [payrollFrequency, setPayrollFrequency] = useState(
    () => defaultPayrollSettings().frequency
  );

  useEffect(() => {
    setEmployerCompanyName(selected.employer_company_name ?? "");
    setAddressState(selected.address_state ?? "TX");
  }, [selected]);

  async function handleGenerate() {
    if (!selectedAccountId) return;
    setBusy(true);
    setFeedback(null);
    const response = await fetch(
      `/api/admin/members/${selected.id}/generate-transactions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: selectedAccountId,
          employerCompanyName,
          addressState,
          debitCount: Number(debitCount),
          creditCount: Number(creditCount),
          periodStart,
          periodEnd,
          payrollMinAmount: Number(payrollMinAmount),
          payrollMaxAmount: Number(payrollMaxAmount),
          payrollFrequency,
        }),
      }
    );
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setFeedback({ type: "error", text: data.error ?? "Generation failed." });
      return;
    }

    const company = employerCompanyName.trim() || "Employer Payroll";
    const rangeLabel =
      data.summary.periodStart && data.summary.periodEnd
        ? `${data.summary.periodStart} through ${data.summary.periodEnd}`
        : `${periodStart} through ${periodEnd}`;
    const payrollLabel = payrollFrequencyLabel(
      data.summary.payrollFrequency ?? payrollFrequency
    );
    const payrollMin = Number(data.summary.payrollMinAmount ?? payrollMinAmount);
    const payrollMax = Number(data.summary.payrollMaxAmount ?? payrollMaxAmount);

    setFeedback({
      type: "success",
      text: `Generated ${data.summary.credits} credits (${formatCurrency(data.summary.totalCreditAmount)}) and ${data.summary.debits} debits (${formatCurrency(data.summary.totalDebitAmount)}) from ${rangeLabel}. Payroll from ${company} runs ${payrollLabel.toLowerCase()} at ${formatCurrency(payrollMin)}–${formatCurrency(payrollMax)} per deposit. Ending balance: ${formatCurrency(data.summary.endingBalance ?? data.account?.available_balance ?? 0)}.`,
    });
    onUpdated();
  }

  if (accounts.length === 0) {
    return (
      <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
        <CardContent className="py-8 text-center text-sm text-white/50">
          This member has no accounts for activity generation.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
      <CardHeader>
        <CardTitle className="font-heading text-lg">Generate Transactions</CardTitle>
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
          <Label className="text-white/70">Employer / Company Name</Label>
          <Input
            value={employerCompanyName}
            onChange={(event) => setEmployerCompanyName(event.target.value)}
            placeholder="e.g. Acme Logistics Inc."
            className="rounded-xl border-white/15 bg-[#06121c] text-white"
          />
          <p className="text-xs text-white/45">
            Payroll direct deposits use the amount range and schedule below.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-white/70">Payroll Min ($)</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={payrollMinAmount}
              onChange={(event) => setPayrollMinAmount(event.target.value)}
              className="rounded-xl border-white/15 bg-[#06121c] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Payroll Max ($)</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={payrollMaxAmount}
              onChange={(event) => setPayrollMaxAmount(event.target.value)}
              className="rounded-xl border-white/15 bg-[#06121c] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Payroll Schedule</Label>
            <select
              value={payrollFrequency}
              onChange={(event) =>
                setPayrollFrequency(event.target.value as typeof payrollFrequency)
              }
              className="w-full rounded-xl border border-white/15 bg-[#06121c] px-3 py-2 text-sm"
            >
              {PAYROLL_FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-white/45">
          {
            PAYROLL_FREQUENCY_OPTIONS.find((option) => option.value === payrollFrequency)
              ?.description
          }
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-white/70">Activity From</Label>
            <Input
              type="date"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
              className="rounded-xl border-white/15 bg-[#06121c] text-white [color-scheme:dark]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Activity Through</Label>
            <Input
              type="date"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
              className="rounded-xl border-white/15 bg-[#06121c] text-white [color-scheme:dark]"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-white/70">Member State</Label>
            <select
              value={addressState}
              onChange={(event) => setAddressState(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-[#06121c] px-3 py-2 text-sm"
            >
              {US_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-white/70"># Credits</Label>
            <Input
              type="number"
              min="0"
              max="200"
              value={creditCount}
              onChange={(event) => setCreditCount(event.target.value)}
              className="rounded-xl border-white/15 bg-[#06121c] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70"># Debits</Label>
            <Input
              type="number"
              min="0"
              max="200"
              value={debitCount}
              onChange={(event) => setDebitCount(event.target.value)}
              className="rounded-xl border-white/15 bg-[#06121c] text-white"
            />
          </div>
        </div>
        <p className="text-xs text-white/45">
          Choose any date range — past or future. Credits and debits are spaced across
          the period like regular account usage. Each payroll deposit stays within your
          min/max range on the selected schedule.
        </p>
        <Button
          disabled={busy || !employerCompanyName.trim()}
          onClick={() => void handleGenerate()}
          className="w-full bg-northium-gold text-[#06121c] hover:bg-northium-gold/90"
        >
          Generate Activity
        </Button>
        <AdminActionFeedback feedback={feedback} />
      </CardContent>
    </Card>
  );
}
