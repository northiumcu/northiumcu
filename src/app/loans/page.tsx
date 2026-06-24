"use client";

import { useState } from "react";
import { PublicLayout } from "@/components/layout/public-layout";
import { PageHeader } from "@/components/marketing/page-header";
import {
  ContentSection,
  InfoGrid,
} from "@/components/marketing/content-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const loanTypes = [
  {
    title: "Auto Loans",
    description:
      "New and used vehicle financing with rates as low as 4.99% APR.",
  },
  {
    title: "Personal Loans",
    description: "Unsecured borrowing from $1,000 to $50,000 for any purpose.",
  },
  {
    title: "Home Loans",
    description: "Fixed and adjustable-rate mortgages with local underwriting.",
  },
  {
    title: "Business Loans",
    description: "Term loans and lines of credit for member-owned businesses.",
  },
  {
    title: "Student Loans",
    description: "Refinancing and private student loan options for members.",
  },
] as const;

export default function LoansPage() {
  const [amount, setAmount] = useState(25000);
  const [rate, setRate] = useState(5.99);
  const [term, setTerm] = useState(60);

  const monthlyRate = rate / 100 / 12;
  const payment =
    monthlyRate > 0
      ? (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) /
        (Math.pow(1 + monthlyRate, term) - 1)
      : amount / term;

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Lending"
        title="Lending Solutions"
        description="Competitive rates and flexible terms backed by a institution you can trust."
        visual="lending"
      />
      <ContentSection>
        <InfoGrid items={loanTypes} columns={3} />
      </ContentSection>
      <ContentSection className="bg-northium-surface">
        <div className="mx-auto max-w-2xl">
          <Card className="rounded-2xl border-northium-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-xl text-northium-primary">
                Loan Calculator
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="amount">Loan Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Interest Rate (%)</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="term">Term (months)</Label>
                  <Input
                    id="term"
                    type="number"
                    value={term}
                    onChange={(e) => setTerm(Number(e.target.value))}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="rounded-xl bg-northium-primary p-6 text-center">
                <p className="text-sm text-white/70">
                  Estimated Monthly Payment
                </p>
                <p className="mt-1 font-heading text-3xl font-bold text-white">
                  {formatter.format(payment)}
                </p>
              </div>
              <p className="text-xs text-northium-muted">
                This calculator provides estimates only. Actual rates and terms
                may vary based on creditworthiness and loan type.
              </p>
            </CardContent>
          </Card>
        </div>
      </ContentSection>
    </PublicLayout>
  );
}
