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

export default function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? undefined;

  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [emailLabel, setEmailLabel] = useState("");

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

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
                  {challengeId ? "Verify Your Sign In" : "Member Sign In"}
                </CardTitle>
                {challengeId && (
                  <p className="text-sm text-northium-muted">
                    Email verification is required for every sign in.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {challengeId ? (
                  <OtpVerificationForm
                    challengeId={challengeId}
                    emailLabel={emailLabel}
                    onSuccess={(redirectTo) => router.push(redirectTo)}
                  />
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4">
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
                    <div className="space-y-2">
                      <Label htmlFor="pin">Account PIN</Label>
                      <Input
                        id="pin"
                        type="password"
                        inputMode="numeric"
                        pattern="\d{6}"
                        maxLength={6}
                        value={pin}
                        onChange={(e) =>
                          setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        className="rounded-xl tracking-[0.3em]"
                        autoComplete="one-time-code"
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
                      disabled={loading || pin.length !== 6}
                      className="w-full bg-northium-primary hover:bg-northium-secondary"
                    >
                      {loading ? "Sending code..." : "Continue"}
                    </Button>
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
