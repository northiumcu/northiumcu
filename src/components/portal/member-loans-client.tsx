"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AmountInput } from "@/components/forms/amount-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoanCard } from "@/components/portal/loan-card";
import { LOAN_PURPOSES, MORTGAGE_PURPOSES } from "@/lib/banking/member-products";
import {
  estimateMonthlyLoanPayment,
  getEstimatedLoanRate,
} from "@/lib/banking/loan-calculator";
import type { Loan } from "@/types/database";
import { formatCurrency, parseAmountInput } from "@/lib/format/currency";

type LoanRow = Loan & {
  purpose?: string | null;
  requested_amount?: number | null;
  monthly_payment?: number | null;
  admin_note?: string | null;
};

export function MemberLoansClient() {
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [applications, setApplications] = useState<LoanRow[]>([]);
  const [loanType, setLoanType] = useState<"personal" | "home" | "auto">("personal");
  const [purpose, setPurpose] = useState("");
  const [amount, setAmount] = useState("");
  const [termMonths, setTermMonths] = useState("60");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function load() {
    void fetch("/api/member/loans")
      .then((r) => r.json())
      .then((data) => {
        setLoans(data.loans ?? []);
        setApplications(data.applications ?? []);
      });
  }

  useEffect(() => {
    load();
  }, []);

  const purposes = loanType === "home" ? MORTGAGE_PURPOSES : LOAN_PURPOSES;

  const parsedAmount = parseAmountInput(amount);
  const parsedTerm = Number(termMonths);
  const estimatedRate = getEstimatedLoanRate(loanType);

  const estimatedMonthlyPayment = useMemo(() => {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return null;
    if (!Number.isFinite(parsedTerm) || parsedTerm < 6) return null;
    return estimateMonthlyLoanPayment(parsedAmount, parsedTerm, estimatedRate);
  }, [parsedAmount, parsedTerm, estimatedRate]);

  const canSubmit =
    Boolean(purpose) &&
    Number.isFinite(parsedAmount) &&
    parsedAmount >= 1000 &&
    Number.isFinite(parsedTerm) &&
    parsedTerm >= 6 &&
    parsedTerm <= 360 &&
    termsAccepted &&
    estimatedMonthlyPayment !== null;

  async function apply() {
    if (!canSubmit || estimatedMonthlyPayment === null) {
      setError("Complete all fields and accept the terms and conditions.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/member/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loanType,
        purpose: purposes.find((p) => p.value === purpose)?.label ?? purpose,
        requestedAmount: parsedAmount,
        termMonths: parsedTerm,
        termsAccepted: true,
      }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Application failed.");
      return;
    }
    setMessage("Application submitted. You will be notified when reviewed.");
    setAmount("");
    setTermsAccepted(false);
    load();
  }

  return (
    <div className="space-y-8">
      {loans.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
      )}

      {applications.length > 0 && (
        <Card className="rounded-2xl border-northium-border">
          <CardHeader>
            <CardTitle className="text-base text-northium-primary">
              Pending Applications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-northium-muted">
            {applications.map((app) => (
              <p key={app.id}>
                {app.loan_type} — {formatCurrency(app.requested_amount ?? app.principal_amount)} —{" "}
                <span className="capitalize">{app.status}</span>
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl border-northium-border">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-northium-primary">
            Apply for a Loan or Mortgage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Loan Type</Label>
              <select
                value={loanType}
                onChange={(e) => {
                  setLoanType(e.target.value as typeof loanType);
                  setPurpose("");
                }}
                className="w-full rounded-xl border border-northium-border px-3 py-2 text-sm"
              >
                <option value="personal">Personal Loan</option>
                <option value="home">Mortgage / Home Loan</option>
                <option value="auto">Auto Loan</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Purpose</Label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full rounded-xl border border-northium-border px-3 py-2 text-sm"
                required
              >
                <option value="">Select purpose…</option>
                {purposes.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Amount Requested</Label>
              <AmountInput
                value={amount}
                onChange={setAmount}
                allowDecimals={false}
                placeholder="25,000"
              />
            </div>
            <div className="space-y-2">
              <Label>Term (months)</Label>
              <Input
                type="number"
                min="6"
                max="360"
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          {estimatedMonthlyPayment !== null && (
            <div className="rounded-xl border border-northium-border bg-northium-surface/60 px-4 py-4">
              <p className="text-sm text-northium-muted">Estimated monthly payment</p>
              <p className="mt-1 font-heading text-2xl font-bold text-northium-primary">
                {formatCurrency(estimatedMonthlyPayment)}
              </p>
              <p className="mt-2 text-xs text-northium-muted">
                Based on {estimatedRate.toFixed(2)}% APR over {parsedTerm} months. Final terms may
                vary after underwriting review.
              </p>
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-northium-border bg-white px-4 py-3 text-sm text-northium-muted">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 rounded border-northium-border accent-northium-primary"
            />
            <span>
              I agree to the{" "}
              <Link
                href="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-northium-primary underline-offset-2 hover:underline"
              >
                Terms and Conditions
              </Link>{" "}
              and{" "}
              <Link
                href="/legal/loan-agreement"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-northium-primary underline-offset-2 hover:underline"
              >
                Loan Agreement
              </Link>
              .
            </span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-northium-success">{message}</p>}
          <Button
            disabled={loading || !canSubmit}
            onClick={() => void apply()}
            className="bg-northium-primary hover:bg-northium-secondary"
          >
            Submit Application
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
