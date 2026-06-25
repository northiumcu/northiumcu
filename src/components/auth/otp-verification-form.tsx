"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OtpVerificationFormProps {
  challengeId: string;
  emailLabel: string;
  resendEmail?: string;
  onChallengeIdChange?: (challengeId: string) => void;
  onSuccess: (redirectTo: string) => void;
}

export function OtpVerificationForm({
  challengeId,
  emailLabel,
  resendEmail,
  onChallengeIdChange,
  onSuccess,
}: OtpVerificationFormProps) {
  const [activeChallengeId, setActiveChallengeId] = useState(challengeId);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    setActiveChallengeId(challengeId);
  }, [challengeId]);

  async function handleResend() {
    if (!resendEmail) return;

    setResending(true);
    setError(null);
    setInfo(null);

    const response = await fetch("/api/auth/signup/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resendEmail }),
    });
    const data = await response.json();
    setResending(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not resend code.");
      return;
    }

    setActiveChallengeId(data.challengeId);
    onChallengeIdChange?.(data.challengeId);
    setCode("");
    setInfo(
      typeof data.message === "string"
        ? data.message
        : "A new verification code was sent to your email."
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: activeChallengeId, code }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      const message =
        typeof data.error === "string" ? data.error : "Verification failed.";
      setError(message);
      if (data.canResend && resendEmail) {
        setInfo("You can request a new code below and keep going.");
      }
      return;
    }

    onSuccess(data.redirectTo ?? "/member");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-northium-muted">
        Enter the 6-digit code sent to <strong>{emailLabel}</strong>.
      </p>
      <div className="space-y-2">
        <Label htmlFor="otp">Verification Code</Label>
        <Input
          id="otp"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="rounded-xl text-center text-lg tracking-[0.4em]"
          placeholder="000000"
          required
        />
      </div>
      {info && (
        <p className="text-sm text-emerald-700" role="status">
          {info}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={loading || code.length !== 6 || !activeChallengeId}
        className="w-full bg-northium-primary hover:bg-northium-secondary"
      >
        {loading ? "Verifying..." : "Verify & Continue"}
      </Button>
      {!activeChallengeId && resendEmail && (
        <p className="text-sm text-northium-muted">
          Request a verification code below to continue your application.
        </p>
      )}
      {resendEmail && (
        <Button
          type="button"
          variant="outline"
          disabled={resending}
          onClick={() => void handleResend()}
          className="w-full rounded-xl"
        >
          {resending ? "Sending new code..." : "Resend verification code"}
        </Button>
      )}
    </form>
  );
}
