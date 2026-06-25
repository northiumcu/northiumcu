"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AccountType } from "@/lib/database/enums";
import {
  ELIGIBILITY_OPTIONS,
  PRIMARY_MEMBERSHIP_ACCOUNT_OPTIONS,
} from "@/lib/auth/membership-options";
import { PublicLayout } from "@/components/layout/public-layout";
import { PageHeader } from "@/components/marketing/page-header";
import { ContentSection } from "@/components/marketing/content-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OtpVerificationForm } from "@/components/auth/otp-verification-form";
import { MathVerificationField } from "@/components/forms/math-verification-field";
import { PinInput } from "@/components/forms/pin-input";
import { formatUSPhoneInput } from "@/lib/format/phone";

export function ApplyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [emailLabel, setEmailLabel] = useState("");
  const [humanCheckToken, setHumanCheckToken] = useState("");
  const [humanCheckQuestion, setHumanCheckQuestion] = useState("");
  const [humanCheckAnswer, setHumanCheckAnswer] = useState("");

  const [form, setForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    pin: "",
    confirmPin: "",
    eligibilityCategory: ELIGIBILITY_OPTIONS[0],
    requestedAccountType: "checking" as AccountType,
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: form.username,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        pin: form.pin,
        confirmPin: form.confirmPin,
        eligibilityCategory: form.eligibilityCategory,
        requestedAccountType: form.requestedAccountType,
        humanCheckToken,
        humanCheckAnswer: Number(humanCheckAnswer),
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Application failed.");
      if (typeof data.error === "string" && data.error.includes("verification")) {
        setHumanCheckToken("");
      }
      return;
    }

    setChallengeId(data.challengeId);
    setEmailLabel(data.email);
  }

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Membership Application"
        title="Join Northium Credit Union"
        description="One secure application. Verify your email, sign in, then complete identity verification in your member portal."
        visual="application"
      />
      <ContentSection>
        <div className="mx-auto max-w-2xl">
          <Card className="rounded-2xl border-northium-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-xl text-northium-primary">
                {challengeId ? "Verify Your Email" : "Membership Application"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {challengeId ? (
                <OtpVerificationForm
                  challengeId={challengeId}
                  emailLabel={emailLabel}
                  onSuccess={(redirectTo) => router.push(redirectTo)}
                />
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={form.firstName}
                        onChange={(e) => updateField("firstName", e.target.value)}
                        className="rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={form.lastName}
                        onChange={(e) => updateField("lastName", e.target.value)}
                        className="rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={form.username}
                        onChange={(e) => updateField("username", e.target.value)}
                        className="rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        className="rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      inputMode="numeric"
                      value={form.phone}
                      onChange={(e) =>
                        updateField("phone", formatUSPhoneInput(e.target.value))
                      }
                      placeholder="(555) 555-0100"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <PinInput
                      id="pin"
                      label="Create Account PIN"
                      value={form.pin}
                      onChange={(value) => updateField("pin", value)}
                      required
                    />
                    <PinInput
                      id="confirmPin"
                      label="Confirm Account PIN"
                      value={form.confirmPin}
                      onChange={(value) => updateField("confirmPin", value)}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="accountType">Account type</Label>
                      <select
                        id="accountType"
                        value={form.requestedAccountType}
                        onChange={(e) =>
                          updateField("requestedAccountType", e.target.value)
                        }
                        className="w-full rounded-xl border border-northium-border bg-white px-3 py-2 text-sm"
                      >
                        {PRIMARY_MEMBERSHIP_ACCOUNT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-northium-muted">
                        A savings account is included with every membership.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="eligibility">Eligibility category</Label>
                      <select
                        id="eligibility"
                        value={form.eligibilityCategory}
                        onChange={(e) =>
                          updateField("eligibilityCategory", e.target.value)
                        }
                        className="w-full rounded-xl border border-northium-border bg-white px-3 py-2 text-sm"
                      >
                        {ELIGIBILITY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <MathVerificationField
                    token={humanCheckToken}
                    question={humanCheckQuestion}
                    answer={humanCheckAnswer}
                    onTokenChange={setHumanCheckToken}
                    onQuestionChange={setHumanCheckQuestion}
                    onAnswerChange={setHumanCheckAnswer}
                    disabled={loading}
                  />

                  {error && (
                    <p className="text-sm text-red-600" role="alert">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !humanCheckToken}
                    className="w-full bg-northium-gold text-northium-primary hover:bg-northium-gold/90"
                  >
                    {loading ? "Submitting..." : "Submit"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
          <p className="mt-6 text-center text-sm text-northium-muted">
            Already a member?{" "}
            <Link
              href="/sign-in"
              className="font-semibold text-northium-primary hover:underline"
            >
              Sign in to your account
            </Link>
          </p>
        </div>
      </ContentSection>
    </PublicLayout>
  );
}
