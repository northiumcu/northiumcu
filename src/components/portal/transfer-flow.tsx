"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Clock3, Download, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PinInput } from "@/components/forms/pin-input";
import { TransactionPinSetupForm } from "@/components/portal/transaction-pin-setup-form";
import { AmountInput } from "@/components/forms/amount-input";
import { sanitizeRoutingNumberInput } from "@/lib/auth/validators";
import {
  formatTransferAccountLabel,
  internalTransferDestinationHint,
  listInternalDestinationAccounts,
  pickDefaultInternalDestination,
} from "@/lib/banking/internal-transfer";
import { isLoanAccountType } from "@/lib/banking/loan-accounts";
import { WIRE_COUNTRIES } from "@/lib/geo/wire-countries";
import { formatCurrency, parseAmountInput } from "@/lib/format/currency";

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

import { TRANSACTION_INCOMPLETE_TITLE } from "@/lib/banking/transfer-pause";

const TRANSFER_FAILURE_MESSAGE =
  "This transfer could not be concluded. Please try again or contact your Northium account officer for assistance.";

const TRANSFER_TIMEOUT_MS = 25_000;
const TRANSFER_SLOW_MS = 8_000;

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
    amount: parseAmountInput(input.amount),
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
    body.beneficiaryBank = input.beneficiaryBank.trim();
  } else if (input.type === "international_wire") {
    body.beneficiaryName = input.beneficiaryName.trim();
    body.beneficiaryBank = input.beneficiaryBank.trim();
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
  const searchParams = useSearchParams();
  const fromAccountId = searchParams.get("from");
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
  const [transferPaused, setTransferPaused] = useState(false);
  const [failedProgress, setFailedProgress] = useState(60);
  const [processingSlow, setProcessingSlow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transactionPinConfigured, setTransactionPinConfigured] = useState<
    boolean | null
  >(null);
  const submitLockRef = useRef(false);

  const isZelle = type === "zelle";
  const showConfirm = !isZelle;
  const sourceAccount = accounts.find((account) => account.id === sourceAccountId);
  const sourceIsLoan = sourceAccount ? isLoanAccountType(sourceAccount.type) : false;
  const availableTransferTypes = useMemo(
    () =>
      sourceIsLoan
        ? transferTypes.filter((item) => item.value === "internal")
        : transferTypes,
    [sourceIsLoan]
  );
  const internalDestinationAccounts = useMemo(
    () => listInternalDestinationAccounts(accounts, sourceAccountId),
    [accounts, sourceAccountId]
  );
  const showSecurityCodes =
    transferRequiresSecurityCodes(type) && (cotRequired || imfRequired);
  const pinStepReady =
    pin.length === 4 &&
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
        const preferredSource =
          fromAccountId && active.some((a: Account) => a.id === fromAccountId)
            ? fromAccountId
            : active[0]?.id;
        if (preferredSource) {
          setSourceAccountId(preferredSource);
          const preferredAccount = active.find(
            (account: Account) => account.id === preferredSource
          );
          if (preferredAccount && isLoanAccountType(preferredAccount.type)) {
            setType("internal");
          }
        }
        const defaultDestination = pickDefaultInternalDestination(
          active,
          preferredSource ?? ""
        );
        if (defaultDestination) setDestinationAccountId(defaultDestination);
      });
    void fetch("/api/member/transfer-requirements")
      .then((r) => r.json())
      .then((data) => {
        setCotRequired(Boolean(data.cotRequired));
        setImfRequired(Boolean(data.imfRequired));
      });
    void fetch("/api/member/transaction-pin")
      .then((r) => r.json())
      .then((data) => {
        setTransactionPinConfigured(Boolean(data.configured));
      });
  }, [fromAccountId]);

  useEffect(() => {
    if (sourceIsLoan && type !== "internal") {
      setType("internal");
    }
  }, [sourceIsLoan, type]);

  useEffect(() => {
    if (type !== "internal" || !sourceAccountId) return;
    const nextDestination = internalDestinationAccounts[0];
    if (!nextDestination) return;

    const valid = internalDestinationAccounts.some(
      (account) => account.id === destinationAccountId
    );
    if (!valid || internalDestinationAccounts.length === 1) {
      setDestinationAccountId(nextDestination.id);
    }
  }, [
    type,
    sourceAccountId,
    destinationAccountId,
    internalDestinationAccounts,
  ]);

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

  function syncDestinationForSource(nextSourceId: string) {
    if (type !== "internal") return;
    const nextDestination = pickDefaultInternalDestination(accounts, nextSourceId);
    setDestinationAccountId(nextDestination ?? "");
  }

  const summary = useMemo(() => {
    const source = accounts.find((a) => a.id === sourceAccountId);
    const destination = accounts.find((a) => a.id === destinationAccountId);
    return {
      typeLabel: transferTypes.find((t) => t.value === type)?.label ?? type,
      from: source
        ? formatTransferAccountLabel(source)
        : "—",
      to:
        type === "internal" && destination
          ? formatTransferAccountLabel(destination)
          : null,
      amount: parseAmountInput(amount || "0"),
      beneficiary: isZelle
        ? zelleContact
        : type === "internal" && destination
          ? formatTransferAccountLabel(destination)
          : beneficiaryName || "—",
      bank: beneficiaryBank.trim() || null,
      country:
        type === "international_wire" && wireCountry ? wireCountry : null,
    };
  }, [
    accounts,
    sourceAccountId,
    type,
    amount,
    beneficiaryName,
    beneficiaryBank,
    zelleContact,
    isZelle,
    wireCountry,
    destinationAccountId,
  ]);

  function requiresBankName() {
    return (
      type === "direct_deposit" ||
      type === "local_wire" ||
      type === "international_wire"
    );
  }

  function validateDetails(): boolean {
    const parsedAmount = parseAmountInput(amount);
    if (!amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount.");
      return false;
    }
    if (requiresBankName() && !beneficiaryBank.trim()) {
      setError("Enter the receiver bank name.");
      return false;
    }
    if (
      (type === "direct_deposit" || type === "local_wire") &&
      (!routingNumber.trim() || !accountNumber.trim())
    ) {
      setError("Routing and account numbers are required.");
      return false;
    }
    if (type === "international_wire") {
      if (!wireSwift.trim() || !wireIban.trim() || !wireCountry) {
        setError("SWIFT, IBAN, and destination country are required.");
        return false;
      }
      if (!beneficiaryName.trim()) {
        setError("Receiver name is required.");
        return false;
      }
    }
    if (type === "internal") {
      if (internalDestinationAccounts.length === 0) {
        setError(
          "You need at least two active accounts, or a loan disbursement account plus checking or savings, for an internal transfer."
        );
        return false;
      }
      if (
        !destinationAccountId ||
        destinationAccountId === sourceAccountId ||
        !internalDestinationAccounts.some(
          (account) => account.id === destinationAccountId
        )
      ) {
        setError("Select a destination account for this transfer.");
        return false;
      }
    }
    if (!isZelle && type !== "internal" && !beneficiaryName.trim()) {
      setError("Receiver name is required.");
      return false;
    }
    if (isZelle && !zelleContact.trim()) {
      setError("Zelle email or mobile number is required.");
      return false;
    }
    return true;
  }

  function goToPin() {
    setError(null);
    if (!validateDetails()) return;
    setStep(showConfirm ? "confirm" : "pin");
  }

  async function submitTransfer() {
    if (submitLockRef.current) return;

    if (showSecurityCodes && cotRequired && !cotCode.trim()) {
      setError("Enter your COT code to continue.");
      return;
    }
    if (showSecurityCodes && imfRequired && !imfCode.trim()) {
      setError("Enter your IMF code to continue.");
      return;
    }
    if (pin.length !== 4) {
      setError("Enter your 4-digit transaction PIN.");
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    setError(null);
    setTransferPaused(false);
    setProcessingSlow(false);
    setStep("processing");
    setProgress(0);

    const tick = setInterval(() => {
      setProgress((p) => (p < 92 ? p + 2 : p));
    }, 200);

    const slowTimer = setTimeout(() => {
      setProcessingSlow(true);
    }, TRANSFER_SLOW_MS);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TRANSFER_TIMEOUT_MS);

    try {
      const response = await fetch("/api/member/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
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

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        transferPaused?: boolean;
        message?: string;
        debited?: boolean;
        transfer?: {
          id?: string;
          status?: string;
          member_message?: string | null;
        };
      };

      if (data.transferPaused && typeof data.message === "string") {
        const pauseAt = 55 + Math.floor(Math.random() * 11);
        setProgress(pauseAt);
        setFailedProgress(pauseAt);
        await new Promise((r) => setTimeout(r, 500));
        setTransferPaused(true);
        setStatusMessage(data.message);
        setStep("failed");
        setPin("");
        return;
      }

      if (!response.ok) {
        const failAt = 55 + Math.floor(Math.random() * 11);
        setProgress(failAt);
        setFailedProgress(failAt);
        await new Promise((r) => setTimeout(r, 400));
        setTransferPaused(false);
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
      await new Promise((r) => setTimeout(r, 300));

      setTransferId(data.transfer?.id ?? null);
      const awaitingReview = data.transfer?.status === "pending_approval";
      setPendingReview(awaitingReview);
      setStatusMessage(
        data.transfer?.member_message ??
          (awaitingReview
            ? "Your transfer is awaiting administrator review. No funds have been deducted from your account yet."
            : "Transfer completed successfully.")
      );
      setStep("success");
      setPin("");
      setCotCode("");
      setImfCode("");
    } catch (error) {
      const timedOut =
        error instanceof DOMException && error.name === "AbortError";
      const failAt = 55 + Math.floor(Math.random() * 11);
      setProgress(failAt);
      setFailedProgress(failAt);
      await new Promise((r) => setTimeout(r, 400));
      setTransferPaused(false);
      setStatusMessage(
        timedOut
          ? "This transfer is taking too long to complete. Please wait a moment, check your account activity, and try again if the transfer did not post."
          : "We could not reach Northium to complete this transfer. Check your connection and try again."
      );
      setStep("failed");
      setPin("");
    } finally {
      clearInterval(tick);
      clearTimeout(slowTimer);
      clearTimeout(timeoutId);
      submitLockRef.current = false;
      setSubmitting(false);
      setProcessingSlow(false);
    }
  }

  function retryTransfer() {
    setStep("pin");
    setProgress(0);
    setFailedProgress(60);
    setTransferPaused(false);
    setError(null);
    setStatusMessage("");
    setProcessingSlow(false);
    submitLockRef.current = false;
    setSubmitting(false);
  }

  function resetFlow() {
    setStep("details");
    setProgress(0);
    setFailedProgress(60);
    setTransferPaused(false);
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
              {sourceIsLoan ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Loan disbursement accounts can only send{" "}
                  <strong>internal transfers</strong> to your checking or savings
                  accounts. External wires, Zelle, and direct deposit are not
                  available from this account.
                </div>
              ) : (
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-northium-border bg-white px-3 py-2 text-sm"
                >
                  {availableTransferTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <Label>From Account</Label>
              <select
                value={sourceAccountId}
                onChange={(e) => {
                  const nextSourceId = e.target.value;
                  const nextSource = accounts.find(
                    (account) => account.id === nextSourceId
                  );
                  if (nextSource && isLoanAccountType(nextSource.type)) {
                    setType("internal");
                  }
                  setSourceAccountId(nextSourceId);
                  syncDestinationForSource(nextSourceId);
                }}
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
                {internalDestinationAccounts.length === 0 ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {sourceAccount
                      ? internalTransferDestinationHint(sourceAccount.type)
                      : "Select a source account to see eligible destinations."}
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-northium-muted">
                      {sourceAccount
                        ? internalTransferDestinationHint(sourceAccount.type)
                        : null}
                    </p>
                    {internalDestinationAccounts.length === 1 ? (
                      (() => {
                        const onlyDestination = internalDestinationAccounts[0]!;
                        return (
                          <div className="rounded-xl border border-northium-border bg-slate-50 px-3 py-2.5 text-sm text-northium-primary">
                            {formatTransferAccountLabel(onlyDestination)}
                            {onlyDestination.available_balance !== undefined
                              ? ` — ${formatCurrency(onlyDestination.available_balance)}`
                              : ""}
                          </div>
                        );
                      })()
                    ) : (
                      <select
                        value={destinationAccountId}
                        onChange={(e) => setDestinationAccountId(e.target.value)}
                        className="w-full rounded-xl border border-northium-border bg-white px-3 py-2 text-sm"
                        required
                      >
                        {internalDestinationAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {formatTransferAccountLabel(account)}
                            {account.available_balance !== undefined
                              ? ` — ${formatCurrency(account.available_balance)}`
                              : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </>
                )}
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
                    <Label>Receiver name</Label>
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
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Receiver Bank</Label>
                      <Input
                        value={beneficiaryBank}
                        onChange={(e) => setBeneficiaryBank(e.target.value)}
                        className="rounded-xl"
                        required
                      />
                    </div>
                  </div>
                )}
                {type === "international_wire" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Receiver Bank</Label>
                      <Input
                        value={beneficiaryBank}
                        onChange={(e) => setBeneficiaryBank(e.target.value)}
                        className="rounded-xl"
                        required
                      />
                    </div>
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
                      <Label>Destination Country</Label>
                      <select
                        value={wireCountry}
                        onChange={(e) => setWireCountry(e.target.value)}
                        className="w-full rounded-xl border border-northium-border bg-white px-3 py-2 text-sm"
                        required
                      >
                        <option value="">Select country</option>
                        {WIRE_COUNTRIES.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label>Amount</Label>
              <AmountInput
                value={amount}
                onChange={setAmount}
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
              onClick={() => {
                if (isZelle) {
                  if (!validateDetails()) return;
                  setStep("pin");
                  return;
                }
                goToPin();
              }}
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
              ...(summary.to ? [["To", summary.to] as const] : []),
              ...(type !== "internal"
                ? ([["Receiver", summary.beneficiary]] as const)
                : []),
              ...(summary.bank ? [["Bank", summary.bank] as const] : []),
              ...(summary.country ? [["Country", summary.country] as const] : []),
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

      {step === "pin" && transactionPinConfigured === null && (
        <Card className="rounded-2xl border-northium-border shadow-sm">
          <CardContent className="py-10 text-center text-sm text-northium-muted">
            Loading security settings…
          </CardContent>
        </Card>
      )}

      {step === "pin" && transactionPinConfigured === false && (
        <Card className="rounded-2xl border-amber-200/80 bg-gradient-to-br from-white to-amber-50/40 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-northium-primary">
              Transaction PIN Required
            </CardTitle>
            <p className="text-sm text-northium-muted">
              Set up your 4-digit transaction PIN before you can authorize this
              transfer. It must be different from your 6-digit account PIN.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <TransactionPinSetupForm
              configured={false}
              onConfigured={() => setTransactionPinConfigured(true)}
              variant="compact"
              idPrefix="transfer"
              submitLabel="Set your transaction PIN"
            />
            <Button
              variant="outline"
              onClick={() => setStep(showConfirm ? "confirm" : "details")}
              className="w-full"
            >
              Back
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "pin" && transactionPinConfigured === true && (
        <Card className="rounded-2xl border-northium-border shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-northium-primary">
              {showSecurityCodes
                ? "Security Verification & PIN"
                : "Authorize with PIN"}
            </CardTitle>
            {showSecurityCodes && (
              <p className="text-sm text-northium-muted">
                Enter your security code(s), then your 4-digit transaction PIN to
                complete this transfer.
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
                  Step 2 — Transaction PIN
                </p>
              )}
              <PinInput
                id="transfer-pin"
                label="4-Digit Transaction PIN"
                value={pin}
                onChange={setPin}
                length={4}
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
                disabled={!pinStepReady || submitting}
                onClick={() => void submitTransfer()}
                className="flex-1 bg-northium-primary hover:bg-northium-secondary"
              >
                {submitting ? "Submitting…" : "Submit Transfer"}
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
            <p className="text-sm text-northium-muted">
              {processingSlow
                ? "Still processing — this can take a few seconds. Please do not close this page."
                : "Processing your transfer…"}
            </p>
            {processingSlow && (
              <Button
                variant="outline"
                onClick={() => {
                  submitLockRef.current = false;
                  setSubmitting(false);
                  setProcessingSlow(false);
                  setStep("pin");
                  setProgress(0);
                  setStatusMessage("");
                  setError(
                    "Transfer cancelled on this screen. Check your account activity before submitting again."
                  );
                }}
              >
                Cancel and go back
              </Button>
            )}
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
                  stroke={transferPaused ? "#FCD34D" : "#DC2626"}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={326.7}
                  strokeDashoffset={326.7 - (326.7 * failedProgress) / 100}
                />
              </svg>
              <span
                className={`absolute inset-0 flex items-center justify-center font-heading text-2xl font-bold ${
                  transferPaused ? "text-amber-600" : "text-red-600"
                }`}
              >
                {failedProgress}%
              </span>
            </div>
            <XCircle
              className={`mx-auto size-12 ${
                transferPaused ? "text-amber-600" : "text-red-600"
              }`}
            />
            <div>
              <h2 className="font-heading text-xl font-bold text-northium-primary">
                {transferPaused
                  ? TRANSACTION_INCOMPLETE_TITLE
                  : "Transfer Could Not Be Completed"}
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
            {pendingReview ? (
              <Clock3 className="mx-auto size-14 text-amber-500" />
            ) : (
              <CheckCircle2 className="mx-auto size-14 text-northium-success" />
            )}
            <div>
              <h2 className="font-heading text-xl font-bold text-northium-primary">
                {pendingReview ? "Submitted for Review" : "Transfer Successful"}
              </h2>
              <p className="mt-2 text-sm text-northium-muted">{statusMessage}</p>
            </div>

            {pendingReview && (
              <div className="mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-left text-sm text-amber-950">
                <p className="font-semibold">No funds have been moved yet</p>
                <p className="mt-2 leading-relaxed">
                  Your transfer request was received and is waiting for administrator
                  approval. Your account balance will not change until the review is
                  complete. You will be notified when it is approved or declined.
                </p>
                <div className="mt-4 space-y-2 border-t border-amber-200/80 pt-4 text-amber-900">
                  <div className="flex justify-between gap-4">
                    <span className="text-amber-800">Type</span>
                    <span className="font-medium">{summary.typeLabel}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-amber-800">From</span>
                    <span className="font-medium">{summary.from}</span>
                  </div>
                  {summary.to && (
                    <div className="flex justify-between gap-4">
                      <span className="text-amber-800">To</span>
                      <span className="font-medium">{summary.to}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <span className="text-amber-800">Amount</span>
                    <span className="font-medium">{formatCurrency(summary.amount)}</span>
                  </div>
                </div>
              </div>
            )}

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
