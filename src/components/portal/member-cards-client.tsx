"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NorthiumMastercard } from "@/components/portal/northium-mastercard";
import { MASTERCARD_FEE } from "@/lib/banking/member-products";

interface CardRecord {
  id: string;
  product_name: string;
  cardholder_name: string;
  last_four: string;
  status: string;
  delivery_eta: string | null;
  design_variant: string;
}

interface Account {
  id: string;
  type: string;
  account_number: string;
  available_balance: number;
}

export function MemberCardsClient() {
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    void fetch("/api/member/cards")
      .then((r) => r.json())
      .then((data) => setCards(data.cards ?? []));
    void fetch("/api/member/accounts")
      .then((r) => r.json())
      .then((data) => {
        const active = (data.accounts ?? []).filter(
          (a: Account & { status: string }) => a.status === "active"
        );
        setAccounts(active);
        if (active[0]) setSourceAccountId(active[0].id);
      });
  }

  useEffect(() => {
    load();
  }, []);

  const hasMastercard = cards.some((c) => c.product_name === "Northium Mastercard");

  async function apply() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/member/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceAccountId, pin }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Application failed.");
      return;
    }
    setMessage(
      `Application submitted. $${MASTERCARD_FEE} processing fee charged. Delivery in 7–30 business days.`
    );
    setPin("");
    load();
  }

  return (
    <div className="space-y-8">
      {cards.length > 0 && (
        <div className="grid gap-8 lg:grid-cols-2">
          {cards.map((card) => (
            <NorthiumMastercard
              key={card.id}
              cardholderName={card.cardholder_name}
              lastFour={card.last_four}
              status={card.status}
              deliveryEta={card.delivery_eta}
            />
          ))}
        </div>
      )}

      {!hasMastercard && accounts.length > 0 && (
        <Card className="rounded-2xl border-northium-border">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-northium-primary">
              Apply for Northium Mastercard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-northium-muted">
              Premium Mastercard with Northium rewards. A one-time ${MASTERCARD_FEE}{" "}
              application and delivery fee applies. Delivery in 7–30 business days.
            </p>
            <div className="space-y-2">
              <Label>Pay fee from account</Label>
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="w-full rounded-xl border border-northium-border px-3 py-2 text-sm"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.type} ••••{a.account_number.slice(-4)} — $
                    {Number(a.available_balance).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Account PIN</Label>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) =>
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className="max-w-xs rounded-xl tracking-[0.3em]"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-northium-success">{message}</p>}
            <Button
              disabled={loading || pin.length !== 6}
              onClick={() => void apply()}
              className="bg-northium-primary hover:bg-northium-secondary"
            >
              Apply — ${MASTERCARD_FEE}
            </Button>
          </CardContent>
        </Card>
      )}

      {cards.length === 0 && accounts.length === 0 && (
        <div className="rounded-2xl border border-northium-border bg-white p-8 text-center text-sm text-northium-muted">
          Cards are available after your accounts are active.
        </div>
      )}
    </div>
  );
}
