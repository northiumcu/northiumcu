"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Account {
  id: string;
  account_number: string;
  type: string;
  status: string;
  available_balance: number;
}

const transferTypes = [
  { value: "internal", label: "Internal Transfer" },
  { value: "ach", label: "ACH" },
  { value: "direct_deposit", label: "Direct Deposit (Incoming)" },
  { value: "local_wire", label: "Local Wire Transfer" },
  { value: "international_wire", label: "International Wire Transfer" },
  { value: "zelle", label: "Zelle" },
] as const;

export default function MemberTransfersPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [type, setType] = useState<string>("internal");
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [destinationAccountId, setDestinationAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryBank, setBeneficiaryBank] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [zelleContact, setZelleContact] = useState("");
  const [wireSwift, setWireSwift] = useState("");
  const [wireIban, setWireIban] = useState("");
  const [wireCountry, setWireCountry] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/member/accounts")
      .then((r) => r.json())
      .then((data) => {
        const active = (data.accounts ?? []).filter(
          (a: Account) => a.status === "active"
        );
        setAccounts(active);
        if (active[0]) setSourceAccountId(active[0].id);
        if (active[1]) setDestinationAccountId(active[1].id);
      });
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/member/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceAccountId,
        destinationAccountId: type === "internal" ? destinationAccountId : undefined,
        type,
        amount: Number(amount),
        memo,
        beneficiaryName,
        beneficiaryBank,
        destinationRoutingNumber: routingNumber,
        destinationAccountNumber: accountNumber,
        zelleContact,
        wireSwift,
        wireIban,
        wireCountry,
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Transfer failed.");
      return;
    }

    setMessage(`Transfer submitted (${data.transfer.status}).`);
    setAmount("");
  }

  if (accounts.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="font-heading text-2xl font-bold text-northium-primary">
          Transfer Funds
        </h1>
        <Card className="rounded-2xl border-northium-border">
          <CardContent className="py-8 text-center text-sm text-northium-muted">
            Transfers are available after an administrator approves your
            membership and issues your 12-digit account number.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-northium-primary">
          Transfer Funds
        </h1>
        <p className="mt-1 text-northium-muted">
          ACH, direct deposit, wires, Zelle, and internal transfers.
        </p>
      </div>
      <Card className="rounded-2xl border-northium-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-northium-primary">
            New Transfer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Transfer Type</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-xl border border-northium-border bg-white px-3 py-2 text-sm"
              >
                {transferTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="from">From Account</Label>
              <select
                id="from"
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="w-full rounded-xl border border-northium-border bg-white px-3 py-2 text-sm"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.type} ••••{account.account_number.slice(-4)} — $
                    {Number(account.available_balance).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {type === "internal" && (
              <div className="space-y-2">
                <Label htmlFor="to">To Account</Label>
                <select
                  id="to"
                  value={destinationAccountId}
                  onChange={(e) => setDestinationAccountId(e.target.value)}
                  className="w-full rounded-xl border border-northium-border bg-white px-3 py-2 text-sm"
                >
                  {accounts
                    .filter((a) => a.id !== sourceAccountId)
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.type} ••••{account.account_number.slice(-4)}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {type !== "internal" && type !== "direct_deposit" && (
              <div className="space-y-2">
                <Label htmlFor="beneficiaryName">Beneficiary Name</Label>
                <Input
                  id="beneficiaryName"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
            )}

            {(type === "ach" || type === "local_wire") && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="routing">Routing Number</Label>
                  <Input
                    id="routing"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>
            )}

            {type === "local_wire" && (
              <div className="space-y-2">
                <Label htmlFor="bank">Beneficiary Bank</Label>
                <Input
                  id="bank"
                  value={beneficiaryBank}
                  onChange={(e) => setBeneficiaryBank(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            )}

            {type === "zelle" && (
              <div className="space-y-2">
                <Label htmlFor="zelle">Zelle Email or Mobile</Label>
                <Input
                  id="zelle"
                  value={zelleContact}
                  onChange={(e) => setZelleContact(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
            )}

            {type === "international_wire" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="swift">SWIFT / BIC</Label>
                  <Input
                    id="swift"
                    value={wireSwift}
                    onChange={(e) => setWireSwift(e.target.value)}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iban">IBAN</Label>
                  <Input
                    id="iban"
                    value={wireIban}
                    onChange={(e) => setWireIban(e.target.value)}
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={wireCountry}
                    onChange={(e) => setWireCountry(e.target.value)}
                    className="rounded-xl"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
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
              <Label htmlFor="memo">Memo (optional)</Label>
              <Input
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            {message && <p className="text-sm text-northium-success">{message}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-northium-primary hover:bg-northium-secondary"
            >
              {loading ? "Submitting..." : "Submit Transfer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
