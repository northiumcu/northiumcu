"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PinInput } from "@/components/forms/pin-input";

interface TransactionPinSetupFormProps {
  configured?: boolean;
  onConfigured?: () => void;
  variant?: "default" | "compact";
  idPrefix?: string;
  submitLabel?: string;
}

export function TransactionPinSetupForm({
  configured = false,
  onConfigured,
  variant = "default",
  idPrefix = "transaction-pin",
  submitLabel,
}: TransactionPinSetupFormProps) {
  const [accountPin, setAccountPin] = useState("");
  const [currentTransactionPin, setCurrentTransactionPin] = useState("");
  const [transactionPin, setTransactionPin] = useState("");
  const [confirmTransactionPin, setConfirmTransactionPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const compact = variant === "compact";
  const ready =
    accountPin.length === 6 &&
    transactionPin.length === 4 &&
    confirmTransactionPin.length === 4 &&
    (!configured || currentTransactionPin.length === 4);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    const response = await fetch("/api/member/transaction-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountPin,
        transactionPin,
        confirmTransactionPin,
        currentTransactionPin: configured ? currentTransactionPin : undefined,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setError(data.error ?? "Could not save transaction PIN.");
      return;
    }

    setMessage(data.message ?? "Transaction PIN saved.");
    setAccountPin("");
    setCurrentTransactionPin("");
    setTransactionPin("");
    setConfirmTransactionPin("");
    onConfigured?.();
  }

  const buttonLabel =
    submitLabel ??
    (configured ? "Update Transaction PIN" : "Set your transaction PIN");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PinInput
        id={`${idPrefix}-account-pin`}
        label="6-Digit Account PIN"
        value={accountPin}
        onChange={setAccountPin}
        length={6}
        variant={compact ? "compact" : "default"}
        required
      />
      {configured && (
        <PinInput
          id={`${idPrefix}-current`}
          label="Current Transaction PIN"
          value={currentTransactionPin}
          onChange={setCurrentTransactionPin}
          length={4}
          variant={compact ? "compact" : "default"}
          required
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <PinInput
          id={`${idPrefix}-new`}
          label={configured ? "New Transaction PIN" : "Create Transaction PIN"}
          value={transactionPin}
          onChange={setTransactionPin}
          length={4}
          variant={compact ? "compact" : "default"}
          required
        />
        <PinInput
          id={`${idPrefix}-confirm`}
          label="Confirm Transaction PIN"
          value={confirmTransactionPin}
          onChange={setConfirmTransactionPin}
          length={4}
          variant={compact ? "compact" : "default"}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-northium-success">{message}</p>}
      <Button
        type="submit"
        disabled={busy || !ready}
        className="bg-northium-primary hover:bg-northium-secondary"
      >
        {busy ? "Saving…" : buttonLabel}
      </Button>
    </form>
  );
}
