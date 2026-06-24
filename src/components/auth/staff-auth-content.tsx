"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import { OtpVerificationForm } from "@/components/auth/otp-verification-form";
import { ADMIN_DASHBOARD_PATH } from "@/lib/auth/admin-paths";

export default function StaffAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? ADMIN_DASHBOARD_PATH;

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
      body: JSON.stringify({
        username,
        pin,
        next,
        portal: "admin",
      }),
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
    <section className="flex min-h-[70vh] items-center border-b border-northium-border bg-northium-primary py-12 sm:py-16">
      <Container>
        <Card className="mx-auto w-full max-w-md rounded-2xl border-white/10 bg-white/95 shadow-2xl backdrop-blur sm:max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-northium-primary/5">
              <Shield className="size-6 text-northium-primary" />
            </div>
            <CardTitle className="font-heading text-2xl text-northium-primary">
              {challengeId ? "Verify sign in" : "Staff access"}
            </CardTitle>
            {challengeId ? (
              <p className="text-sm text-northium-muted">
                Enter the verification code sent to your email.
              </p>
            ) : (
              <p className="text-sm text-northium-muted">
                Authorized personnel only. Username and account PIN required.
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
                  <Label htmlFor="staff-username">Username</Label>
                  <Input
                    id="staff-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="rounded-xl"
                    autoComplete="username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-pin">Account PIN</Label>
                  <Input
                    id="staff-pin"
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
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
