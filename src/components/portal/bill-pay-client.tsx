"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PinInput } from "@/components/forms/pin-input";
import type { BillPayPayeeView } from "@/lib/banking/bill-pay";
import { sanitizeRoutingNumberInput } from "@/lib/auth/validators";

interface Account {
  id: string;
  account_number: string;
  type: string;
  status: string;
  available_balance: number;
}

type View = "pay" | "payees" | "success";

const emptyPayeeForm = {
  nickname: "",
  payeeName: "",
  routingNumber: "",
  accountNumber: "",
  category: "",
};

export function BillPayClient() {
  const [view, setView] = useState<View>("pay");
  const [payees, setPayees] = useState<BillPayPayeeView[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [billPayEnabled, setBillPayEnabled] = useState(true);
  const [cotRequired, setCotRequired] = useState(false);
  const [imfRequired, setImfRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [payeeForm, setPayeeForm] = useState(emptyPayeeForm);
  const [selectedPayeeId, setSelectedPayeeId] = useState("");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [pin, setPin] = useState("");
  const [cotCode, setCotCode] = useState("");
  const [imfCode, setImfCode] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [reqRes, accountsRes, payeesRes] = await Promise.all([
      fetch("/api/member/transfer-requirements"),
      fetch("/api/member/accounts"),
      fetch("/api/member/bill-pay/payees"),
    ]);

    const reqData = await reqRes.json();
    const accountsData = await accountsRes.json();
    const payeesData = await payeesRes.json();
    setLoading(false);

    setBillPayEnabled(reqData.billPayEnabled !== false);
    setCotRequired(Boolean(reqData.cotRequired));
    setImfRequired(Boolean(reqData.imfRequired));

    const activeAccounts = (accountsData.accounts ?? []).filter(
      (account: Account) => account.status === "active"
    );
    setAccounts(activeAccounts);
    if (activeAccounts[0]) setSourceAccountId(activeAccounts[0].id);

    if (payeesRes.ok) {
      const list = (payeesData.payees ?? []) as BillPayPayeeView[];
      setPayees(list);
      if (list[0]) setSelectedPayeeId(list[0].id);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAddPayee(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/member/bill-pay/payees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payeeForm),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not save payee.");
      return;
    }

    setMessage("Payee added successfully.");
    setPayeeForm(emptyPayeeForm);
    await load();
    setView("pay");
  }

  async function handleRemovePayee(id: string) {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/member/bill-pay/payees/${id}`, {
      method: "DELETE",
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not remove payee.");
      return;
    }

    setMessage("Payee removed.");
    await load();
  }

  async function handlePayBill(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedPayeeId || !sourceAccountId || !amount) {
      setError("Select a payee, account, and amount.");
      return;
    }

    setBusy(true);
    setError(null);

    const response = await fetch("/api/member/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceAccountId,
        type: "bill_pay",
        payeeId: selectedPayeeId,
        amount: Number(amount),
        memo: memo || undefined,
        cotCode: cotRequired ? cotCode : undefined,
        imfCode: imfRequired ? imfCode : undefined,
        pin,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Payment failed.");
      return;
    }

    setStatusMessage(
      data.transfer?.member_message ?? "Your bill payment was submitted successfully."
    );
    setPin("");
    setCotCode("");
    setImfCode("");
    setAmount("");
    setMemo("");
    setView("success");
  }

  if (loading) {
    return <p className="text-sm text-northium-muted">Loading Bill Pay...</p>;
  }

  if (!billPayEnabled) {
    return (
      <Card className="rounded-2xl border-amber-200 bg-amber-50/80">
        <CardContent className="py-8 text-center text-sm text-amber-950">
          Bill Pay is currently turned off on your account. Contact your Northium
          account officer if you need this service enabled.
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className="rounded-2xl border-northium-border">
        <CardContent className="py-8 text-center text-sm text-northium-muted">
          Bill Pay is available after your membership accounts are active.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={view === "pay" || view === "success" ? "default" : "outline"}
          onClick={() => setView("pay")}
          className={
            view === "pay" || view === "success"
              ? "bg-northium-primary hover:bg-northium-secondary"
              : ""
          }
        >
          Pay a Bill
        </Button>
        <Button
          type="button"
          variant={view === "payees" ? "default" : "outline"}
          onClick={() => setView("payees")}
          className={view === "payees" ? "bg-northium-primary hover:bg-northium-secondary" : ""}
        >
          Manage Payees
        </Button>
      </div>

      {(message || error) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {error ?? message}
        </div>
      )}

      {view === "success" && (
        <Card className="rounded-2xl border-emerald-200 bg-gradient-to-br from-white to-emerald-50 py-10 text-center shadow-sm">
          <CardContent className="space-y-4">
            <CheckCircle2 className="mx-auto size-14 text-emerald-600" />
            <div>
              <h2 className="font-heading text-xl font-bold text-northium-primary">
                Bill Payment Submitted
              </h2>
              <p className="mt-2 text-sm text-northium-muted">{statusMessage}</p>
            </div>
            <Button
              onClick={() => {
                setView("pay");
                setMessage(null);
              }}
              className="bg-northium-primary hover:bg-northium-secondary"
            >
              Pay Another Bill
            </Button>
          </CardContent>
        </Card>
      )}

      {view === "pay" && (
        <Card className="overflow-hidden rounded-2xl border-rose-200/70 bg-gradient-to-br from-white via-rose-50/30 to-orange-50/20 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-northium-primary">
              Pay a Bill
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payees.length === 0 ? (
              <div className="rounded-xl border border-dashed border-northium-border bg-white/70 p-6 text-center text-sm text-northium-muted">
                Add a payee first to send bill payments.
                <div className="mt-4">
                  <Button
                    type="button"
                    onClick={() => setView("payees")}
                    className="bg-northium-primary hover:bg-northium-secondary"
                  >
                    <Plus className="size-4" />
                    Add Payee
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePayBill} className="space-y-4">
                <div className="space-y-2">
                  <Label>Payee</Label>
                  <select
                    value={selectedPayeeId}
                    onChange={(e) => setSelectedPayeeId(e.target.value)}
                    className="w-full rounded-xl border border-northium-border bg-white px-3 py-2 text-sm"
                    required
                  >
                    {payees.map((payee) => (
                      <option key={payee.id} value={payee.id}>
                        {payee.nickname} — {payee.payeeName} ••••{payee.accountLastFour}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>From Account</Label>
                  <select
                    value={sourceAccountId}
                    onChange={(e) => setSourceAccountId(e.target.value)}
                    className="w-full rounded-xl border border-northium-border bg-white px-3 py-2 text-sm"
                    required
                  >
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.type} ••••{account.account_number.slice(-4)} — $
                        {Number(account.available_balance).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Memo (optional)</Label>
                    <Input
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      className="rounded-xl"
                      placeholder="Account number, invoice, etc."
                    />
                  </div>
                </div>

                {(cotRequired || imfRequired) && (
                  <div className="space-y-3 rounded-xl border border-northium-border bg-white/70 p-4">
                    {cotRequired && (
                      <div className="space-y-2">
                        <Label htmlFor="bill-cot">COT Code</Label>
                        <Input
                          id="bill-cot"
                          value={cotCode}
                          onChange={(e) => setCotCode(e.target.value)}
                          className="rounded-xl"
                          required
                        />
                      </div>
                    )}
                    {imfRequired && (
                      <div className="space-y-2">
                        <Label htmlFor="bill-imf">IMF Code</Label>
                        <Input
                          id="bill-imf"
                          value={imfCode}
                          onChange={(e) => setImfCode(e.target.value)}
                          className="rounded-xl"
                          required
                        />
                      </div>
                    )}
                  </div>
                )}

                <PinInput
                  id="bill-pay-pin"
                  label="Account PIN"
                  value={pin}
                  onChange={setPin}
                  variant="compact"
                  required
                />

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button
                  type="submit"
                  disabled={busy || pin.length !== 6}
                  className="w-full bg-gradient-to-r from-rose-600 to-orange-500 hover:from-rose-700 hover:to-orange-600"
                >
                  {busy ? "Processing..." : "Submit Payment"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {view === "payees" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border-northium-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-northium-primary">
                Saved Payees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {payees.length === 0 ? (
                <p className="text-sm text-northium-muted">No payees saved yet.</p>
              ) : (
                payees.map((payee) => (
                  <div
                    key={payee.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-northium-border bg-white p-4"
                  >
                    <div>
                      <p className="font-medium text-northium-primary">{payee.nickname}</p>
                      <p className="text-sm text-northium-muted">{payee.payeeName}</p>
                      <p className="mt-1 text-xs text-northium-muted">
                        Routing {payee.routingNumber} · Acct ••••{payee.accountLastFour}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void handleRemovePayee(payee.id)}
                      className="shrink-0 text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-northium-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-northium-primary">
                Add Payee
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPayee} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nickname</Label>
                  <Input
                    value={payeeForm.nickname}
                    onChange={(e) =>
                      setPayeeForm((current) => ({ ...current, nickname: e.target.value }))
                    }
                    placeholder="Electric Company"
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payee Name</Label>
                  <Input
                    value={payeeForm.payeeName}
                    onChange={(e) =>
                      setPayeeForm((current) => ({ ...current, payeeName: e.target.value }))
                    }
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Routing Number</Label>
                    <Input
                      inputMode="numeric"
                      maxLength={9}
                      value={payeeForm.routingNumber}
                      onChange={(e) =>
                        setPayeeForm((current) => ({
                          ...current,
                          routingNumber: sanitizeRoutingNumberInput(e.target.value),
                        }))
                      }
                      className="rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input
                      inputMode="numeric"
                      value={payeeForm.accountNumber}
                      onChange={(e) =>
                        setPayeeForm((current) => ({
                          ...current,
                          accountNumber: e.target.value.replace(/\D/g, "").slice(0, 17),
                        }))
                      }
                      className="rounded-xl"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Category (optional)</Label>
                  <Input
                    value={payeeForm.category}
                    onChange={(e) =>
                      setPayeeForm((current) => ({ ...current, category: e.target.value }))
                    }
                    placeholder="Utilities"
                    className="rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-northium-primary hover:bg-northium-secondary"
                >
                  <Plus className="size-4" />
                  Save Payee
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
