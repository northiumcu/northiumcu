"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoanCard } from "@/components/portal/loan-card";
import { LOAN_PURPOSES, MORTGAGE_PURPOSES } from "@/lib/banking/member-products";
import type { Loan } from "@/types/database";
import { formatCurrency } from "@/lib/format/currency";

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

  async function apply() {
    setLoading(true);
    setError(null);
    setMessage(null);
    const response = await fetch("/api/member/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        loanType,
        purpose: purposes.find((p) => p.value === purpose)?.label ?? purpose,
        requestedAmount: Number(amount),
        termMonths: Number(termMonths),
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
              <Input
                type="number"
                min="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-xl"
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
          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-northium-success">{message}</p>}
          <Button
            disabled={loading || !purpose || !amount}
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
