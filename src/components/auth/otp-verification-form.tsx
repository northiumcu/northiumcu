"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OtpVerificationFormProps {
  challengeId: string;
  emailLabel: string;
  onSuccess: (redirectTo: string) => void;
}

export function OtpVerificationForm({
  challengeId,
  emailLabel,
  onSuccess,
}: OtpVerificationFormProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, code }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Verification failed.");
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
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full bg-northium-primary hover:bg-northium-secondary"
      >
        {loading ? "Verifying..." : "Verify & Continue"}
      </Button>
    </form>
  );
}
