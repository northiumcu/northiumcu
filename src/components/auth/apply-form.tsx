"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AccountType } from "@/lib/database/enums";
import {
  ELIGIBILITY_OPTIONS,
  MEMBERSHIP_ACCOUNT_OPTIONS,
} from "@/lib/auth/membership-options";
import { PublicLayout } from "@/components/layout/public-layout";
import { PageHeader } from "@/components/marketing/page-header";
import { ContentSection } from "@/components/marketing/content-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OtpVerificationForm } from "@/components/auth/otp-verification-form";
import { cn } from "@/lib/utils";

export function ApplyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [emailLabel, setEmailLabel] = useState("");

  const [form, setForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    pin: "",
    confirmPin: "",
    eligibilityCategory: ELIGIBILITY_OPTIONS[0],
    requestedAccountTypes: ["checking"] as AccountType[],
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleAccountType(type: AccountType) {
    setForm((prev) => {
      const selected = prev.requestedAccountTypes.includes(type)
        ? prev.requestedAccountTypes.filter((item) => item !== type)
        : [...prev.requestedAccountTypes, type];
      return {
        ...prev,
        requestedAccountTypes: selected.length > 0 ? selected : [type],
      };
    });
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
        requestedAccountTypes: form.requestedAccountTypes,
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Application failed.");
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
        visual="membership"
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
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      className="rounded-xl"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="pin">Create Account PIN</Label>
                      <Input
                        id="pin"
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={form.pin}
                        onChange={(e) =>
                          updateField("pin", e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        className="rounded-xl"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPin">Confirm Account PIN</Label>
                      <Input
                        id="confirmPin"
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={form.confirmPin}
                        onChange={(e) =>
                          updateField(
                            "confirmPin",
                            e.target.value.replace(/\D/g, "").slice(0, 6)
                          )
                        }
                        className="rounded-xl"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Account Types</Label>
                    <p className="text-xs text-northium-muted">
                      Tap to select one or more accounts to open, such as checking
                      and savings.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {MEMBERSHIP_ACCOUNT_OPTIONS.map((option) => {
                        const selected = form.requestedAccountTypes.includes(
                          option.value
                        );
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => toggleAccountType(option.value)}
                            className={cn(
                              "rounded-xl border px-4 py-3 text-left transition-colors",
                              selected
                                ? "border-northium-gold bg-northium-gold/10"
                                : "border-northium-border bg-white hover:border-northium-gold/50"
                            )}
                          >
                            <p className="font-heading text-sm font-semibold text-northium-primary">
                              {option.label}
                            </p>
                            <p className="mt-1 text-xs text-northium-muted">
                              {option.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="eligibility">Eligibility Category</Label>
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

                  {error && (
                    <p className="text-sm text-red-600" role="alert">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-northium-gold text-northium-primary hover:bg-northium-gold/90"
                  >
                    {loading ? "Submitting..." : "Submit & Send Verification Code"}
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
