"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/layout/container";
import {
  ADMIN_DASHBOARD_PATH,
  STAFF_LOGIN_EMAIL,
} from "@/lib/auth/admin-paths";

export default function StaffAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? ADMIN_DASHBOARD_PATH;

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/auth/staff-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: STAFF_LOGIN_EMAIL,
        password,
        next,
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      const message =
        typeof data.error === "string"
          ? data.error
          : "Sign in failed. Check your password.";
      setError(message);
      return;
    }

    router.push(data.redirectTo ?? ADMIN_DASHBOARD_PATH);
    router.refresh();
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
              Staff access
            </CardTitle>
            <p className="text-sm text-northium-muted">
              Authorized personnel only. Sign in with your staff email and
              password.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff-email">Staff email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={STAFF_LOGIN_EMAIL}
                  readOnly
                  className="rounded-xl bg-northium-surface"
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-password">Password</Label>
                <Input
                  id="staff-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl"
                  autoComplete="current-password"
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
                disabled={loading || !password}
                className="w-full bg-northium-primary hover:bg-northium-secondary"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
