"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Download, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PinInput } from "@/components/forms/pin-input";
import { sanitizeRoutingNumberInput } from "@/lib/auth/validators";
import { formatCurrency } from "@/lib/format/currency";

interface Account {
  id: string;
  account_number: string;
  type: string;
  status: string;
  available_balance: number;
}

const transferTypes = [
  { value: "internal", label: "Internal Transfer" },
  { value: "direct_deposit", label: "Direct Deposit" },
  { value: "local_wire", label: "Local Wire Transfer" },
  { value: "international_wire", label: "International Wire Transfer" },
  { value: "zelle", label: "Zelle" },
] as const;

type Step = "details" | "confirm" | "pin" | "processing" | "failed" | "success";

const TRANSFER_FAILURE_MESSAGE =
  "This transfer could not be concluded. Please try again or contact your Northium account officer for assistance.";

function transferRequiresSecurityCodes(transferType: string) {
  return (
    transferType !== "direct_deposit" &&
    transferType !== "internal" &&
    transferType !== "zelle"
  );
}

function buildTransferRequestBody(input: {
  type: string;
  sourceAccountId: string;
  destinationAccountId: string;
  amount: string;
  memo: string;
  beneficiaryName: string;
  beneficiaryBank: string;
  routingNumber: string;
  accountNumber: string;
  zelleContact: string;
  wireSwift: string;
  wireIban: string;
  wireCountry: string;
  cotCode: string;
  imfCode: string;
  pin: string;
  showSecurityCodes: boolean;
  cotRequired: boolean;
  imfRequired: boolean;
  isZelle: boolean;
}) {
  const body: Record<string, unknown> = {
    sourceAccountId: input.sourceAccountId,
    type: input.type,
    amount: Number(input.amount),
    pin: input.pin,
  };

  const memo = input.memo.trim();
  if (memo) body.memo = memo;

  if (input.type === "internal") {
    body.destinationAccountId = input.destinationAccountId;
    return body;
  }

  if (input.type === "zelle") {
    body.zelleContact = input.zelleContact.trim();
    return body;
  }

  if (input.type === "direct_deposit" || input.type === "local_wire") {
    body.beneficiaryName = input.beneficiaryName.trim();
    body.destinationRoutingNumber = input.routingNumber.trim();
    body.destinationAccountNumber = input.accountNumber.trim();
    if (input.type === "local_wire" && input.beneficiaryBank.trim()) {
      body.beneficiaryBank = input.beneficiaryBank.trim();
    }
  } else if (input.type === "international_wire") {
    body.beneficiaryName = input.beneficiaryName.trim();
    if (input.beneficiaryBank.trim()) body.beneficiaryBank = input.beneficiaryBank.trim();
    body.wireSwift = input.wireSwift.trim();
    body.wireIban = input.wireIban.trim();
    body.wireCountry = input.wireCountry.trim();
  }

  if (input.showSecurityCodes && input.cotRequired && input.cotCode.trim()) {
    body.cotCode = input.cotCode.trim();
  }
  if (input.showSecurityCodes && input.imfRequired && input.imfCode.trim()) {
    body.imfCode = input.imfCode.trim();
  }

  return body;
}

export function TransferFlow() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [type, setType] = useState<string>("direct_deposit");
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
  const [cotCode, setCotCode] = useState("");
  const [imfCode, setImfCode] = useState("");
  const [pin, setPin] = useState("");
  const [cotRequired, setCotRequired] = useState(false);
  const [imfRequired, setImfRequired] = useState(false);
  const [step, setStep] = useState<Step>("details");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transferId, setTransferId] = useState<string | null>(null);
  const [pendingReview, setPendingReview] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const isZelle = type === "zelle";
  const showConfirm = !isZelle;
  const showSecurityCodes =
    transferRequiresSecurityCodes(type) && (cotRequired || imfRequired);
  const pinStepReady =
    pin.length === 6 &&
    (!showSecurityCodes ||
      ((!cotRequired || cotCode.trim().length > 0) &&
        (!imfRequired || imfCode.trim().length > 0)));

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
    void fetch("/api/member/transfer-requirements")
      .then((r) => r.json())
      .then((data) => {
        setCotRequired(Boolean(data.cotRequired));
        setImfRequired(Boolean(data.imfRequired));
      });
  }, []);

  useEffect(() => {
    setBeneficiaryName("");
    setBeneficiaryBank("");
    setRoutingNumber("");
    setAccountNumber("");
    setZelleContact("");
    setWireSwift("");
    setWireIban("");
    setWireCountry("");
    setCotCode("");
    setImfCode("");
    setError(null);
  }, [type]);

  const summary = useMemo(() => {
    const source = accounts.find((a) => a.id === sourceAccountId);
    return {
      typeLabel: transferTypes.find((t) => t.value === type)?.label ?? type,
      from: source
        ? `${source.type} ••••${source.account_number.slice(-4)}`
        : "—",
      amount: Number(amount || 0),
      beneficiary: isZelle
        ? zelleContact
        : beneficiaryName || "—",
    };
  }, [
    accounts,
    sourceAccountId,
    type,
    amount,
    beneficiaryName,
    zelleContact,
    isZelle,
  ]);

  function goToPin() {
    setError(null);
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setStep(showConfirm ? "confirm" : "pin");
  }

  async function submitTransfer() {
    if (showSecurityCodes && cotRequired && !cotCode.trim()) {
      setError("Enter your COT code to continue.");
      return;
    }
    if (showSecurityCodes && imfRequired && !imfCode.trim()) {
      setError("Enter your IMF code to continue.");
      return;
    }
    if (pin.length !== 6) {
      setError("Enter your 6-digit account PIN.");
      return;
    }

    setError(null);
    setStep("processing");
    setProgress(0);

    const tick = setInterval(() => {
      setProgress((p) => (p < 55 ? p + 4 : p));
    }, 100);

    const response = await fetch("/api/member/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        buildTransferRequestBody({
          type,
          sourceAccountId,
          destinationAccountId,
          amount,
          memo,
          beneficiaryName,
          beneficiaryBank,
          routingNumber,
          accountNumber,
          zelleContact,
          wireSwift,
          wireIban,
          wireCountry,
          cotCode,
          imfCode,
          pin,
          showSecurityCodes,
          cotRequired,
          imfRequired,
          isZelle,
        })
      ),
    });

    clearInterval(tick);

    const data = await response.json();

    if (!response.ok) {
      setProgress(60);
      await new Promise((r) => setTimeout(r, 900));
      setStatusMessage(
        typeof data.error === "string" && data.error.trim()
          ? data.error
          : TRANSFER_FAILURE_MESSAGE
      );
      setStep("failed");
      setPin("");
      return;
    }

    setProgress(100);
    await new Promise((r) => setTimeout(r, 400));

    setTransferId(data.transfer?.id ?? null);
    setPendingReview(data.transfer?.status === "pending_approval");
    setStatusMessage(
      data.transfer?.member_message ?? "Transfer completed successfully."
    );
    setStep("success");
    setPin("");
    setCotCode("");
    setImfCode("");
  }

  function retryTransfer() {
    setStep("pin");
    setProgress(0);
    setError(null);
    setStatusMessage("");
  }

  function resetFlow() {
    setStep("details");
    setProgress(0);
    setAmount("");
    setPin("");
    setTransferId(null);
    setError(null);
  }

  if (accounts.length === 0) {
    return (
      <Card className="rounded-2xl border-northium-border">
        <CardContent className="py-8 text-center text-sm text-northium-muted">
          Transfers are available after an administrator approves your membership.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {step === "details" && (
        <Card className="rounded-2xl border-northium-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-northium-primary">
              Transfer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Transfer Type</Label>
              <select
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
              <Label>From Account</Label>
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="w-full rounded-xl border border-northium-border bg-white px-3 py-2 text-sm"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.type} ••••{account.account_number.slice(-4)} —{" "}
                    {formatCurrency(account.available_balance)}
                  </option>
                ))}
              </select>
            </div>

            {type === "internal" && (
              <div className="space-y-2">
                <Label>To Account</Label>
                <select
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

            {isZelle ? (
              <div className="space-y-2">
                <Label>Zelle Email or Mobile</Label>
                <Input
                  value={zelleContact}
                  onChange={(e) => setZelleContact(e.target.value)}
                  placeholder="name@email.com or (555) 123-4567"
                  className="rounded-xl"
                  required
                />
              </div>
            ) : (
              <>
                {type !== "internal" && (
                  <div className="space-y-2">
                    <Label>Receiver / Beneficiary Name</Label>
                    <Input
                      value={beneficiaryName}
                      onChange={(e) => setBeneficiaryName(e.target.value)}
                      className="rounded-xl"
                      required
                    />
                  </div>
                )}
                {(type === "direct_deposit" || type === "local_wire") && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Routing Number</Label>
                      <Input
                        inputMode="numeric"
                        maxLength={9}
                        value={routingNumber}
                        onChange={(e) =>
                          setRoutingNumber(sanitizeRoutingNumberInput(e.target.value))
                        }
                        className="rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input
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
                    <Label>Receiver Bank</Label>
                    <Input
                      value={beneficiaryBank}
                      onChange={(e) => setBeneficiaryBank(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                )}
                {type === "international_wire" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>SWIFT / BIC</Label>
                      <Input
                        value={wireSwift}
                        onChange={(e) => setWireSwift(e.target.value)}
                        className="rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>IBAN</Label>
                      <Input
                        value={wireIban}
                        onChange={(e) => setWireIban(e.target.value)}
                        className="rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Country</Label>
                      <Input
                        value={wireCountry}
                        onChange={(e) => setWireCountry(e.target.value)}
                        className="rounded-xl"
                        required
                      />
                    </div>
                  </div>
                )}
              </>
            )}

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
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              type="button"
              onClick={() => (isZelle ? setStep("pin") : goToPin())}
              className="w-full bg-northium-primary hover:bg-northium-secondary"
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "confirm" && (
        <Card className="rounded-2xl border-2 border-northium-gold/40 shadow-md">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-northium-primary">
              Confirm Transfer Details
            </CardTitle>
            <p className="text-sm text-northium-muted">
              Review carefully before entering your PIN.
            </p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Type", summary.typeLabel],
              ["From", summary.from],
              ["Receiver", summary.beneficiary],
              ["Amount", formatCurrency(summary.amount)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between border-b border-northium-border py-2"
              >
                <span className="text-northium-muted">{label}</span>
                <span className="font-medium text-northium-primary">{value}</span>
              </div>
            ))}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setStep("details")} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => setStep("pin")}
                className="flex-1 bg-northium-primary hover:bg-northium-secondary"
              >
                Confirm & Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "pin" && (
        <Card className="rounded-2xl border-northium-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-northium-primary">
              {showSecurityCodes
                ? "Security Verification & PIN"
                : "Authorize with PIN"}
            </CardTitle>
            {showSecurityCodes && (
              <p className="text-sm text-northium-muted">
                Enter your security code(s), then your account PIN to complete
                this transfer.
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {showSecurityCodes && (
              <div className="space-y-3 rounded-xl border border-northium-border bg-northium-surface/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-northium-muted">
                  Step 1 — Security codes
                </p>
                <p className="text-sm text-northium-muted">
                  Contact your Northium account officer if you do not have your
                  code.
                </p>
                {cotRequired && (
                  <div className="space-y-2">
                    <Label htmlFor="cot-code">COT Code</Label>
                    <Input
                      id="cot-code"
                      value={cotCode}
                      onChange={(e) => setCotCode(e.target.value)}
                      className="rounded-xl"
                      autoComplete="off"
                      required
                    />
                  </div>
                )}
                {imfRequired && (
                  <div className="space-y-2">
                    <Label htmlFor="imf-code">IMF Code</Label>
                    <Input
                      id="imf-code"
                      value={imfCode}
                      onChange={(e) => setImfCode(e.target.value)}
                      className="rounded-xl"
                      autoComplete="off"
                      required
                    />
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              {showSecurityCodes && (
                <p className="text-xs font-semibold uppercase tracking-wider text-northium-muted">
                  Step 2 — Account PIN
                </p>
              )}
              <PinInput
                id="transfer-pin"
                label="6-Digit Account PIN"
                value={pin}
                onChange={setPin}
                variant="compact"
                required
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(showConfirm ? "confirm" : "details")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                disabled={!pinStepReady}
                onClick={() => void submitTransfer()}
                className="flex-1 bg-northium-primary hover:bg-northium-secondary"
              >
                Submit Transfer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "processing" && (
        <Card className="rounded-2xl border-northium-border py-12 text-center shadow-sm">
          <CardContent className="flex flex-col items-center gap-6">
            <div className="relative size-32">
              <svg className="size-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="10"
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#D4A64A"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={326.7}
                  animate={{ strokeDashoffset: 326.7 - (326.7 * progress) / 100 }}
                  transition={{ duration: 0.2 }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-heading text-2xl font-bold text-northium-primary">
                {progress}%
              </span>
            </div>
            <p className="text-sm text-northium-muted">Processing your transfer…</p>
          </CardContent>
        </Card>
      )}

      {step === "failed" && (
        <Card className="rounded-2xl border-red-200 py-10 text-center shadow-sm">
          <CardContent className="space-y-6">
            <div className="relative mx-auto size-32">
              <svg className="size-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#FECACA"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={326.7}
                  strokeDashoffset={326.7 - (326.7 * 60) / 100}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-heading text-2xl font-bold text-red-600">
                !
              </span>
            </div>
            <XCircle className="mx-auto size-12 text-red-600" />
            <div>
              <h2 className="font-heading text-xl font-bold text-northium-primary">
                Transfer Could Not Be Completed
              </h2>
              <p className="mt-2 text-sm text-northium-muted">{statusMessage}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={retryTransfer}
                className="bg-northium-primary hover:bg-northium-secondary sm:min-w-[160px]"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/member/accounts" />}
                className="sm:min-w-[160px]"
              >
                Return to Accounts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "success" && (
        <Card className="rounded-2xl border-northium-border py-10 text-center shadow-sm">
          <CardContent className="space-y-6">
            <CheckCircle2 className="mx-auto size-14 text-northium-success" />
            <div>
              <h2 className="font-heading text-xl font-bold text-northium-primary">
                {pendingReview ? "Submitted for Review" : "Transfer Successful"}
              </h2>
              <p className="mt-2 text-sm text-northium-muted">{statusMessage}</p>
            </div>
            {transferId && !pendingReview && (
              <Button variant="outline" nativeButton={false} render={
                <a href={`/api/member/transfers/${transferId}/receipt`} download />
              }>
                <Download className="mr-2 size-4" />
                Download PDF Receipt
              </Button>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                onClick={resetFlow}
                className="sm:min-w-[160px]"
              >
                Do Another Transfer
              </Button>
              <Button
                nativeButton={false}
                render={<Link href="/member/accounts" />}
                className="bg-northium-primary hover:bg-northium-secondary sm:min-w-[160px]"
              >
                Return to Accounts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
