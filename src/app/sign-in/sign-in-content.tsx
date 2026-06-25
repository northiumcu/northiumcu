"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Shield } from "lucide-react";
import { PublicLayout } from "@/components/layout/public-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { BankingImage } from "@/components/marketing/banking-image";
import { OtpVerificationForm } from "@/components/auth/otp-verification-form";
import { PinInput } from "@/components/forms/pin-input";

type SignInView = "login" | "forgot-request" | "forgot-reset";

export default function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;

  const [view, setView] = useState<SignInView>("login");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [emailLabel, setEmailLabel] = useState("");

  const [forgotChallengeId, setForgotChallengeId] = useState<string | null>(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, pin, next }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Sign in failed.");
      return;
    }

    setChallengeId(data.challengeId);
    setEmailLabel(data.email);
  }

  async function handleForgotRequest(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/auth/forgot-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Request failed.");
      return;
    }

    setForgotChallengeId(data.challengeId);
    setForgotEmail(data.email);
    setView("forgot-reset");
    setSuccess("Verification code sent to your email.");
  }

  async function handleResetPin(event: React.FormEvent) {
    event.preventDefault();
    if (!forgotChallengeId) return;

    if (newPin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/auth/reset-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challengeId: forgotChallengeId,
        code: resetCode,
        newPin,
        confirmPin,
      }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "PIN reset failed.");
      return;
    }

    setView("login");
    setPin("");
    setResetCode("");
    setNewPin("");
    setConfirmPin("");
    setForgotChallengeId(null);
    setSuccess(
      typeof data.message === "string"
        ? data.message
        : "PIN updated. Sign in with your new PIN."
    );
  }

  const title = challengeId
    ? "Verify Your Sign In"
    : view === "forgot-request"
      ? "Forgot Account PIN"
      : view === "forgot-reset"
        ? "Reset Account PIN"
        : "Member Sign In";

  return (
    <PublicLayout>
      <section className="border-b border-northium-border bg-northium-surface py-12 sm:py-16">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="hidden lg:block">
              <p className="text-sm font-semibold uppercase tracking-widest text-northium-gold">
                Member Access
              </p>
              <h1 className="mt-3 font-heading text-3xl font-extrabold text-northium-primary">
                Secure Sign In
              </h1>
              <p className="mt-4 max-w-md text-northium-muted">
                Sign in with your username and account PIN. A one-time code will
                be sent to your email every time you sign in.
              </p>
              <div className="mt-8 overflow-hidden rounded-2xl border border-northium-border shadow-lg">
                <BankingImage
                  visual="portal"
                  className="aspect-[4/3] w-full"
                  sizes="45vw"
                />
              </div>
            </div>
            <Card className="mx-auto w-full max-w-md rounded-2xl border-northium-border shadow-lg sm:max-w-lg">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-northium-primary/5">
                  <Shield className="size-6 text-northium-primary" />
                </div>
                <CardTitle className="font-heading text-2xl text-northium-primary">
                  {title}
                </CardTitle>
                {challengeId && (
                  <p className="text-sm text-northium-muted">
                    Email verification is required for every sign in.
                  </p>
                )}
                {view === "forgot-reset" && (
                  <p className="text-sm text-northium-muted">
                    Enter the code sent to <strong>{forgotEmail}</strong>, then
                    choose a new 6-digit PIN.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {challengeId ? (
                  <OtpVerificationForm
                    challengeId={challengeId}
                    emailLabel={emailLabel}
                    resendMode="login"
                    onChallengeIdChange={setChallengeId}
                    onSuccess={(redirectTo) => router.push(redirectTo)}
                  />
                ) : view === "forgot-request" ? (
                  <form onSubmit={handleForgotRequest} className="space-y-4">
                    <p className="text-sm text-northium-muted">
                      Enter your username and we&apos;ll email a verification code
                      so you can set a new PIN.
                    </p>
                    <div className="space-y-2">
                      <Label htmlFor="forgot-username">Username</Label>
                      <Input
                        id="forgot-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="rounded-xl"
                        autoComplete="username"
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
                      disabled={loading || !username.trim()}
                      className="w-full bg-northium-primary hover:bg-northium-secondary"
                    >
                      {loading ? "Sending code..." : "Send Verification Code"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setView("login");
                        setError(null);
                      }}
                    >
                      Back to Sign In
                    </Button>
                  </form>
                ) : view === "forgot-reset" ? (
                  <form onSubmit={handleResetPin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-code">Verification Code</Label>
                      <Input
                        id="reset-code"
                        inputMode="numeric"
                        pattern="\d{6}"
                        maxLength={6}
                        value={resetCode}
                        onChange={(e) =>
                          setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        className="rounded-xl text-center tracking-[0.4em]"
                        placeholder="000000"
                        required
                      />
                    </div>
                    <PinInput
                      id="new-pin"
                      label="New Account PIN"
                      value={newPin}
                      onChange={setNewPin}
                      length={6}
                      required
                    />
                    <PinInput
                      id="confirm-new-pin"
                      label="Confirm Account PIN"
                      value={confirmPin}
                      onChange={setConfirmPin}
                      length={6}
                      required
                    />
                    {error && (
                      <p className="text-sm text-red-600" role="alert">
                        {error}
                      </p>
                    )}
                    {success && (
                      <p className="text-sm text-northium-success" role="status">
                        {success}
                      </p>
                    )}
                    <Button
                      type="submit"
                      disabled={
                        loading ||
                        resetCode.length !== 6 ||
                        newPin.length !== 6 ||
                        confirmPin.length !== 6
                      }
                      className="w-full bg-northium-primary hover:bg-northium-secondary"
                    >
                      {loading ? "Updating PIN..." : "Update PIN"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setView("forgot-request");
                        setError(null);
                        setSuccess(null);
                      }}
                    >
                      Resend Code
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4">
                    {success && (
                      <p className="rounded-xl border border-northium-success/30 bg-northium-success/10 px-3 py-2 text-sm text-northium-success">
                        {success}
                      </p>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="rounded-xl"
                        autoComplete="username"
                        required
                      />
                    </div>
                    <PinInput
                      id="pin"
                      label="Account PIN"
                      value={pin}
                      onChange={setPin}
                      length={6}
                      required
                    />
                    {error && (
                      <p className="text-sm text-red-600" role="alert">
                        {error}
                      </p>
                    )}
                    <Button
                      type="submit"
                      disabled={loading || pin.length !== 6}
                      className="w-full bg-northium-primary hover:bg-northium-secondary"
                    >
                      {loading ? "Sending code..." : "Continue"}
                    </Button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setView("forgot-request");
                          setError(null);
                          setSuccess(null);
                        }}
                        className="text-sm font-semibold text-northium-primary hover:underline"
                      >
                        Forgot PIN?
                      </button>
                    </div>
                  </form>
                )}
                <p className="mt-6 text-center text-sm text-northium-muted">
                  Not a member?{" "}
                  <Link
                    href="/apply"
                    className="font-semibold text-northium-primary hover:underline"
                  >
                    Apply for membership
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>
    </PublicLayout>
  );
}
