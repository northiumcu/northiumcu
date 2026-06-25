"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { AccountType } from "@/lib/database/enums";
import {
  ELIGIBILITY_OPTIONS,
  PRIMARY_MEMBERSHIP_ACCOUNT_OPTIONS,
} from "@/lib/auth/membership-options";
import {
  clearSignupProgress,
  readSignupProgress,
  writeSignupProgress,
} from "@/lib/auth/signup-progress-storage";
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

type SignupStage =
  | "none"
  | "pending_verification"
  | "registered_incomplete"
  | "registered_complete"
  | "expired";

type SignupStatus = {
  stage: SignupStage;
  email?: string;
  maskedEmail?: string;
  challengeId?: string;
  firstName?: string;
  message?: string;
};

export function ApplyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumeMessage, setResumeMessage] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [emailLabel, setEmailLabel] = useState("");
  const [resumeEmail, setResumeEmail] = useState("");
  const [verificationStep, setVerificationStep] = useState(false);
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

  const beginVerification = useCallback((status: SignupStatus) => {
    if (!status.email) return;

    setVerificationStep(true);
    setEmailLabel(status.maskedEmail ?? status.email);
    setResumeEmail(status.email);
    setChallengeId(status.challengeId ?? null);
    setResumeMessage(status.message ?? "Continue where you left off.");
    writeSignupProgress({
      email: status.email,
      challengeId: status.challengeId,
      updatedAt: new Date().toISOString(),
    });
  }, []);

  const loadSignupStatus = useCallback(
    async (email: string, options?: { silent?: boolean }) => {
      const response = await fetch(
        `/api/auth/signup/status?email=${encodeURIComponent(email)}`
      );
      const status = (await response.json()) as SignupStatus & { error?: string };

      if (!response.ok) {
        if (!options?.silent) {
          setError(status.error ?? "Could not load your application status.");
        }
        return null;
      }

      if (status.stage === "pending_verification") {
        beginVerification(status);
        if (!status.challengeId) {
          const resendResponse = await fetch("/api/auth/signup/resend-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          const resendData = await resendResponse.json();
          if (resendResponse.ok) {
            beginVerification({
              stage: "pending_verification",
              email: resendData.email,
              maskedEmail: resendData.maskedEmail,
              challengeId: resendData.challengeId,
              firstName: resendData.firstName,
              message: resendData.message,
            });
          }
        }
        return status;
      }

      if (status.stage === "registered_incomplete") {
        clearSignupProgress();
        setResumeMessage(status.message ?? null);
        setError(null);
        return status;
      }

      if (status.stage === "registered_complete") {
        clearSignupProgress();
        setResumeMessage(status.message ?? null);
        return status;
      }

      if (status.stage === "expired") {
        setResumeMessage(status.message ?? null);
        setForm((prev) => ({ ...prev, email }));
        return status;
      }

      return status;
    },
    [beginVerification]
  );

  useEffect(() => {
    async function restoreProgress() {
      const stored = readSignupProgress();
      if (stored?.email) {
        await loadSignupStatus(stored.email, { silent: true });
      }
      setRestoring(false);
    }

    void restoreProgress();
  }, [loadSignupStatus]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleResumeRequest(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResumeMessage(null);

    const response = await fetch("/api/auth/signup/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resumeEmail }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      const status = await loadSignupStatus(resumeEmail);
      if (status?.stage === "registered_incomplete" || status?.stage === "registered_complete") {
        return;
      }
      setError(typeof data.error === "string" ? data.error : "Could not resume application.");
      return;
    }

    beginVerification({
      stage: "pending_verification",
      email: data.email,
      maskedEmail: data.maskedEmail,
      challengeId: data.challengeId,
      firstName: data.firstName,
      message: data.message,
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResumeMessage(null);

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
      if (data.stage === "registered_incomplete") {
        clearSignupProgress();
        setResumeMessage(
          typeof data.error === "string"
            ? data.error
            : "Your account is ready. Sign in to finish membership."
        );
        return;
      }

      setError(typeof data.error === "string" ? data.error : "Application failed.");
      if (typeof data.error === "string" && data.error.includes("verification")) {
        setHumanCheckToken("");
      }
      return;
    }

    beginVerification({
      stage: "pending_verification",
      email: data.email,
      maskedEmail: data.email,
      challengeId: data.challengeId,
      message: data.message,
    });
  }

  function handleVerificationSuccess(redirectTo: string) {
    clearSignupProgress();
    router.push(redirectTo);
  }

  function handleChallengeIdChange(nextChallengeId: string) {
    setChallengeId(nextChallengeId);
    const stored = readSignupProgress();
    if (stored?.email) {
      writeSignupProgress({
        email: stored.email,
        challengeId: nextChallengeId,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  const showResumePanel = !verificationStep && !restoring;
  const incompleteSignup =
    resumeMessage?.includes("Sign in") || resumeMessage?.includes("already registered");

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
                {verificationStep ? "Verify Your Email" : "Membership Application"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {restoring ? (
                <p className="text-sm text-northium-muted">Checking for an in-progress application...</p>
              ) : verificationStep ? (
                <>
                  {resumeMessage && (
                    <p className="mb-4 text-sm text-sky-900">{resumeMessage}</p>
                  )}
                  <OtpVerificationForm
                    challengeId={challengeId ?? ""}
                    emailLabel={emailLabel}
                    resendEmail={resumeEmail}
                    onChallengeIdChange={handleChallengeIdChange}
                    onSuccess={handleVerificationSuccess}
                  />
                </>
              ) : (
                <>
                  {showResumePanel && (
                    <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-4">
                      <p className="text-sm font-medium text-northium-primary">
                        Already started your application?
                      </p>
                      <p className="mt-1 text-sm text-northium-muted">
                        Enter the email you used and we&apos;ll send a fresh verification code so you can pick up where you left off.
                      </p>
                      <form onSubmit={handleResumeRequest} className="mt-4 space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="resumeEmail">Email Address</Label>
                          <Input
                            id="resumeEmail"
                            type="email"
                            value={resumeEmail}
                            onChange={(e) => setResumeEmail(e.target.value)}
                            className="rounded-xl"
                            placeholder="you@example.com"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          variant="outline"
                          disabled={loading || !resumeEmail}
                          className="w-full rounded-xl"
                        >
                          {loading ? "Sending code..." : "Continue application"}
                        </Button>
                      </form>
                    </div>
                  )}

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
                        variant="compact"
                        required
                      />
                      <PinInput
                        id="confirmPin"
                        label="Confirm Account PIN"
                        value={form.confirmPin}
                        onChange={(value) => updateField("confirmPin", value)}
                        variant="compact"
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

                    {resumeMessage && (
                      <div
                        className={`rounded-xl border p-3 text-sm ${
                          incompleteSignup
                            ? "border-amber-200 bg-amber-50 text-amber-900"
                            : "border-sky-200 bg-sky-50 text-sky-900"
                        }`}
                        role="status"
                      >
                        {resumeMessage}
                        {incompleteSignup && (
                          <div className="mt-3">
                            <Link
                              href="/sign-in"
                              className="font-semibold text-northium-primary hover:underline"
                            >
                              Go to sign in
                            </Link>
                          </div>
                        )}
                      </div>
                    )}

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
                </>
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
