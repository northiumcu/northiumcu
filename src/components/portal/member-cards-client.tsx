"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PinInput } from "@/components/forms/pin-input";
import { NorthiumMastercard } from "@/components/portal/northium-mastercard";
import { MASTERCARD_FEE } from "@/lib/banking/member-products";
import { formatCurrency } from "@/lib/format/currency";

interface CardRecord {
  id: string;
  product_name: string;
  cardholder_name: string;
  last_four: string;
  status: string;
  delivery_eta: string | null;
  design_variant: string;
  expires_at: string | null;
  detailsAvailable?: boolean;
  maskedPan?: string | null;
}

interface Account {
  id: string;
  type: string;
  account_number: string;
  available_balance: number;
}

interface CardDetails {
  pan: string;
  cvv: string;
  expiry: string;
  cardholderName: string;
}

export function MemberCardsClient() {
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailsCardId, setDetailsCardId] = useState<string | null>(null);
  const [detailsPin, setDetailsPin] = useState("");
  const [details, setDetails] = useState<CardDetails | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

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

  const hasMastercard = cards.some(
    (c) =>
      c.product_name === "Northium Mastercard" &&
      !["cancelled", "replaced", "expired"].includes(c.status)
  );

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
      `Application submitted. ${formatCurrency(MASTERCARD_FEE)} processing fee charged. Your card is pending Northium review.`
    );
    setPin("");
    load();
  }

  function openDetails(cardId: string) {
    setDetailsCardId(cardId);
    setDetails(null);
    setDetailsError(null);
    setDetailsPin("");
  }

  function closeDetails() {
    setDetailsCardId(null);
    setDetails(null);
    setDetailsError(null);
    setDetailsPin("");
  }

  async function revealDetails() {
    if (!detailsCardId) return;
    setDetailsLoading(true);
    setDetailsError(null);
    const response = await fetch(`/api/member/cards/${detailsCardId}/details`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: detailsPin }),
    });
    const data = await response.json();
    setDetailsLoading(false);

    if (!response.ok) {
      setDetailsError(data.error ?? "Could not load card details.");
      return;
    }

    setDetails({
      pan: data.card.pan,
      cvv: data.card.cvv,
      expiry: data.card.expiry,
      cardholderName: data.card.cardholderName,
    });
  }

  return (
    <div className="space-y-8">
      {cards.length > 0 && (
        <div className="grid gap-10 lg:grid-cols-2">
          {cards.map((card) => (
            <NorthiumMastercard
              key={card.id}
              cardholderName={card.cardholder_name}
              lastFour={card.last_four}
              status={card.status}
              deliveryEta={card.delivery_eta}
              expiresAt={card.expires_at}
              maskedPan={card.maskedPan}
              detailsAvailable={card.detailsAvailable}
              onViewDetails={
                card.detailsAvailable ? () => openDetails(card.id) : undefined
              }
            />
          ))}
        </div>
      )}

      {detailsCardId && (
        <Card className="rounded-2xl border-northium-border shadow-lg">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-northium-primary">
              Card Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {details ? (
              <div className="grid gap-4 rounded-xl border border-northium-border bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-northium-muted">
                    Card number
                  </p>
                  <p className="mt-1 font-mono text-lg text-northium-primary">
                    {details.pan}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-northium-muted">
                    Cardholder
                  </p>
                  <p className="mt-1 font-medium text-northium-primary">
                    {details.cardholderName}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-northium-muted">
                    Expiry
                  </p>
                  <p className="mt-1 font-mono text-lg text-northium-primary">
                    {details.expiry}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-northium-muted">
                    CVV
                  </p>
                  <p className="mt-1 font-mono text-lg text-northium-primary">
                    {details.cvv}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-northium-muted">
                  Enter your account PIN to view your full card number and security
                  code.
                </p>
                <PinInput
                  id="card-details-pin"
                  label="Account PIN"
                  value={detailsPin}
                  onChange={setDetailsPin}
                  variant="compact"
                  required
                />
                {detailsError && (
                  <p className="text-sm text-red-600">{detailsError}</p>
                )}
                <div className="flex gap-3">
                  <Button
                    disabled={detailsLoading || detailsPin.length !== 6}
                    onClick={() => void revealDetails()}
                    className="bg-northium-primary hover:bg-northium-secondary"
                  >
                    {detailsLoading ? "Verifying..." : "Show Details"}
                  </Button>
                  <Button variant="outline" onClick={closeDetails}>
                    Close
                  </Button>
                </div>
              </>
            )}
            {details && (
              <Button variant="outline" onClick={closeDetails}>
                Close
              </Button>
            )}
          </CardContent>
        </Card>
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
              Premium Mastercard with Northium rewards. A one-time{" "}
              {formatCurrency(MASTERCARD_FEE)} application fee applies. After review, your
              digital card credentials will appear here.
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
                    {a.type} ••••{a.account_number.slice(-4)} —{" "}
                    {formatCurrency(a.available_balance)}
                  </option>
                ))}
              </select>
            </div>
            <PinInput
              id="card-apply-pin"
              label="Account PIN"
              value={pin}
              onChange={setPin}
              variant="compact"
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-northium-success">{message}</p>}
            <Button
              disabled={loading || pin.length !== 6}
              onClick={() => void apply()}
              className="bg-northium-primary hover:bg-northium-secondary"
            >
              Apply — {formatCurrency(MASTERCARD_FEE)}
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
