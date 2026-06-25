"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f2233] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-xl bg-northium-gold/15">
            <Shield className="size-6 text-northium-gold" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-white">
            Control System
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Authorized personnel only. Staff email and password required.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staff-email" className="text-white/70">
              Staff email
            </Label>
            <Input
              id="staff-email"
              type="email"
              value={STAFF_LOGIN_EMAIL}
              readOnly
              className="rounded-xl border-white/15 bg-[#06121c] text-white"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="staff-password" className="text-white/70">
              Password
            </Label>
            <Input
              id="staff-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border-white/15 bg-[#06121c] text-white"
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-northium-gold text-[#06121c] hover:bg-northium-gold/90"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
