"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MemberAccount {
  id: string;
  account_number: string;
  type: string;
  balance: number;
  available_balance: number;
  status: string;
}

interface MemberRecord {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  member_status: string;
  member_number: string | null;
  employer_company_name: string | null;
  address_state: string | null;
  delay_transactions: boolean;
  cot_required: boolean;
  imf_required: boolean;
  has_cot_code?: boolean;
  has_imf_code?: boolean;
  accounts: MemberAccount[] | null;
}

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

export function MemberControlsPanel() {
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");

  const [employerCompanyName, setEmployerCompanyName] = useState("");
  const [addressState, setAddressState] = useState("TX");
  const [debitCount, setDebitCount] = useState("12");
  const [creditCount, setCreditCount] = useState("8");

  const [cotCode, setCotCode] = useState("");
  const [imfCode, setImfCode] = useState("");
  const [cotRequired, setCotRequired] = useState(false);
  const [imfRequired, setImfRequired] = useState(false);
  const [delayTransactions, setDelayTransactions] = useState(false);

  const selected = useMemo(
    () => members.find((m) => m.id === selectedId) ?? null,
    [members, selectedId]
  );

  const accounts = selected?.accounts ?? [];

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/members");
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Failed to load members.");
      return;
    }
    const list = (data.members ?? []) as MemberRecord[];
    setMembers(list);
    if (!selectedId && list[0]) {
      setSelectedId(list[0].id);
    }
  }, [selectedId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    setEmployerCompanyName(selected.employer_company_name ?? "");
    setAddressState(selected.address_state ?? "TX");
    setCotRequired(selected.cot_required);
    setImfRequired(selected.imf_required);
    setDelayTransactions(selected.delay_transactions);
    setCotCode("");
    setImfCode("");
    const firstAccount = selected.accounts?.[0];
    if (firstAccount) setSelectedAccountId(firstAccount.id);
  }, [selected]);

  async function handleAdjust(direction: "credit" | "debit") {
    if (!selectedAccountId || !adjustAmount) return;
    setBusy(true);
    setMessage(null);
    setError(null);
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
      setError(data.error ?? "Adjustment failed.");
      return;
    }
    setMessage(
      `${direction === "credit" ? "Funded" : "Debited"} $${Number(adjustAmount).toFixed(2)}. New balance: $${Number(data.balance).toFixed(2)}`
    );
    setAdjustAmount("");
    void load();
  }

  async function handleGenerate() {
    if (!selected || !selectedAccountId) return;
    setBusy(true);
    setMessage(null);
    setError(null);
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
        }),
      }
    );
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Generation failed.");
      return;
    }
    setMessage(
      `Generated ${data.summary.credits} credits ($${Number(data.summary.totalCreditAmount).toFixed(2)}) and ${data.summary.debits} debits ($${Number(data.summary.totalDebitAmount).toFixed(2)}). Payroll credits use ${employerCompanyName} twice weekly.`
    );
    void load();
  }

  async function handleSaveProfile() {
    if (!selected) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    const response = await fetch(`/api/admin/members/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employerCompanyName,
        addressState,
        cotRequired,
        imfRequired,
        delayTransactions,
        cotCode: cotCode || undefined,
        imfCode: imfCode || undefined,
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Save failed.");
      return;
    }
    setMessage("Member profile and transfer codes updated.");
    setCotCode("");
    setImfCode("");
    void load();
  }

  async function updateMemberStatus(
    memberStatus: "active" | "paused" | "suspended"
  ) {
    if (!selected) return;
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
    setMessage(null);
    setError(null);
    const response = await fetch(`/api/admin/members/${selected.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberStatus }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Status update failed.");
      return;
    }
    setMessage(
      memberStatus === "active"
        ? "Member access restored."
        : memberStatus === "paused"
          ? "Member account paused — they can sign in but cannot transfer or edit."
          : "Member account suspended — sign-in will be blocked."
    );
    void load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">
          Member Controls
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Fund accounts, generate activity, and configure transfer security codes.
        </p>
      </div>

      {(message || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-500/30 bg-red-500/10 text-red-200"
              : "border-northium-gold/30 bg-northium-gold/10 text-northium-gold"
          }`}
        >
          {error ?? message}
        </div>
      )}

      <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-white">
            Select Member
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-sm text-white/50">Loading members...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-white/50">No active members yet.</p>
          ) : (
            <>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
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
                  {cotRequired && (
                    <Badge className="bg-white/10 text-white/70">
                      COT {selected.has_cot_code ? "configured" : "needs code"}
                    </Badge>
                  )}
                  {imfRequired && (
                    <Badge className="bg-white/10 text-white/70">
                      IMF {selected.has_imf_code ? "configured" : "needs code"}
                    </Badge>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {selected && (
        <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-white">
              Account Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-white/55">
              <strong className="text-white/80">Pause</strong> — member can sign in
              but cannot transfer or edit their profile.{" "}
              <strong className="text-white/80">Suspend</strong> — sign-in is
              blocked with a message to contact their account officer.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={busy || selected.member_status === "paused"}
                variant="outline"
                onClick={() => void updateMemberStatus("paused")}
                className="border-amber-500/30 bg-transparent text-amber-200 hover:bg-amber-500/10"
              >
                Pause Account
              </Button>
              <Button
                disabled={busy || selected.member_status === "suspended"}
                variant="outline"
                onClick={() => void updateMemberStatus("suspended")}
                className="border-red-500/30 bg-transparent text-red-200 hover:bg-red-500/10"
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
                className="bg-northium-gold text-[#06121c] hover:bg-northium-gold/90"
              >
                Restore Access
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {selected && accounts.length > 0 && (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
              <CardHeader>
                <CardTitle className="font-heading text-lg">
                  Fund / Debit Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Account</Label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                    className="w-full rounded-xl border border-white/15 bg-[#06121c] px-3 py-2 text-sm"
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.type} ••••{account.account_number.slice(-4)} — $
                        {Number(account.available_balance).toFixed(2)}
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
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="rounded-xl border-white/15 bg-[#06121c] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white/70">Description (optional)</Label>
                  <Input
                    value={adjustDescription}
                    onChange={(e) => setAdjustDescription(e.target.value)}
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
                    className="flex-1 border-white/20 bg-transparent text-white hover:bg-white/5"
                  >
                    Debit
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
              <CardHeader>
                <CardTitle className="font-heading text-lg">
                  Generate Transactions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white/70">Employer / Company Name</Label>
                  <Input
                    value={employerCompanyName}
                    onChange={(e) => setEmployerCompanyName(e.target.value)}
                    placeholder="e.g. Acme Logistics Inc."
                    className="rounded-xl border-white/15 bg-[#06121c] text-white"
                  />
                  <p className="text-xs text-white/45">
                    Payroll credits post twice per week from this company.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="text-white/70">Member State</Label>
                    <select
                      value={addressState}
                      onChange={(e) => setAddressState(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-[#06121c] px-3 py-2 text-sm"
                    >
                      {US_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
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
                      onChange={(e) => setCreditCount(e.target.value)}
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
                      onChange={(e) => setDebitCount(e.target.value)}
                      className="rounded-xl border-white/15 bg-[#06121c] text-white"
                    />
                  </div>
                </div>
                <p className="text-xs text-white/45">
                  Debits use merchants near the member&apos;s state. Credits include
                  bi-weekly payroll from the employer above.
                </p>
                <Button
                  disabled={busy || !employerCompanyName.trim()}
                  onClick={() => void handleGenerate()}
                  className="w-full bg-northium-gold text-[#06121c] hover:bg-northium-gold/90"
                >
                  Generate Activity
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                Delay Transaction Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-white/55">
                When enabled, every transfer this member submits requires your
                approval before funds are debited. The member is notified of each
                decision.
              </p>
              <Button
                type="button"
                disabled={busy}
                onClick={async () => {
                  if (!selected) return;
                  const next = !delayTransactions;
                  setDelayTransactions(next);
                  setBusy(true);
                  await fetch(`/api/admin/members/${selected.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ delayTransactions: next }),
                  });
                  setBusy(false);
                  setMessage(
                    next
                      ? "DELAY TRANSACTION is ON for this member."
                      : "DELAY TRANSACTION is OFF — transfers process immediately."
                  );
                  void load();
                }}
                className={
                  delayTransactions
                    ? "w-full bg-red-500/90 text-white hover:bg-red-500"
                    : "w-full bg-northium-gold text-[#06121c] hover:bg-northium-gold/90"
                }
              >
                {delayTransactions ? "DELAY TRANSACTION — ON" : "DELAY TRANSACTION — OFF"}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
            <CardHeader>
              <CardTitle className="font-heading text-lg">
                Transfer Security Codes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-white/55">
                When enabled, members must enter these codes during outbound
                transfers. They are prompted to contact their account officer if
                they do not have a code.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3 rounded-xl border border-white/10 p-4">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={cotRequired}
                      onChange={(e) => setCotRequired(e.target.checked)}
                      className="rounded"
                    />
                    Require COT Code
                  </label>
                  <Input
                    value={cotCode}
                    onChange={(e) => setCotCode(e.target.value)}
                    placeholder="Set or update COT code"
                    className="rounded-xl border-white/15 bg-[#06121c] text-white"
                  />
                </div>
                <div className="space-y-3 rounded-xl border border-white/10 p-4">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={imfRequired}
                      onChange={(e) => setImfRequired(e.target.checked)}
                      className="rounded"
                    />
                    Require IMF Code
                  </label>
                  <Input
                    value={imfCode}
                    onChange={(e) => setImfCode(e.target.value)}
                    placeholder="Set or update IMF code"
                    className="rounded-xl border-white/15 bg-[#06121c] text-white"
                  />
                </div>
              </div>
              <Button
                disabled={busy}
                onClick={() => void handleSaveProfile()}
                className="bg-northium-gold text-[#06121c] hover:bg-northium-gold/90"
              >
                Save Profile & Codes
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
