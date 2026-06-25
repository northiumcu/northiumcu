"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertsPanel } from "@/components/portal/alerts-panel";
import { TransactionPinSetupForm } from "@/components/portal/transaction-pin-setup-form";

export function MemberSecurityClient() {
  const [profile, setProfile] = useState<{
    email: string;
    member_status: string;
  } | null>(null);
  const [transactionPinConfigured, setTransactionPinConfigured] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetch("/api/member/profile").then((r) => r.json()),
      fetch("/api/member/transaction-pin").then((r) => r.json()),
    ]).then(([profileData, pinData]) => {
      setProfile(profileData.profile ?? null);
      setTransactionPinConfigured(Boolean(pinData.configured));
    });
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="overflow-hidden rounded-2xl border-emerald-200/70 bg-gradient-to-br from-white to-emerald-50/60 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-northium-primary">
              Sign-In Verification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email one-time code</p>
                <p className="text-sm text-northium-muted">
                  Required at every sign-in to {profile?.email ?? "your email"}
                </p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
            </div>
            <p className="text-sm text-northium-muted">
              Northium protects your account with email verification plus your
              6-digit account PIN.
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-2xl border-sky-200/70 bg-gradient-to-br from-white to-sky-50/60 shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg text-northium-primary">
              Account PIN
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-northium-muted">
              Your 6-digit account PIN is used to sign in. Recover your username
              or reset your PIN anytime from the sign-in page.
            </p>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/sign-in?recover=1" />}
              className="rounded-xl border-sky-200"
            >
              Recover Username or PIN
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden rounded-2xl border-amber-200/70 bg-gradient-to-br from-white to-amber-50/60 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-heading text-lg text-northium-primary">
              Transaction PIN
            </CardTitle>
            <Badge
              className={
                transactionPinConfigured
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-900"
              }
            >
              {transactionPinConfigured ? "Configured" : "Required"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-northium-muted">
            Your 4-digit transaction PIN authorizes transfers, bill payments, and
            card actions. It must be different from your 6-digit account PIN.
          </p>
          <TransactionPinSetupForm
            configured={transactionPinConfigured}
            onConfigured={() => setTransactionPinConfigured(true)}
            variant="compact"
            idPrefix="security"
          />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold text-northium-primary">
          Account Status
        </h2>
        <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-northium-primary">Membership status</p>
              <p className="text-sm capitalize text-northium-muted">
                {profile?.member_status ?? "loading…"}
              </p>
            </div>
            {profile?.member_status === "active" && (
              <Badge className="bg-emerald-100 text-emerald-800">Active</Badge>
            )}
            {profile?.member_status === "paused" && (
              <Badge className="bg-amber-100 text-amber-800">Paused</Badge>
            )}
            {profile?.member_status === "suspended" && (
              <Badge className="bg-red-100 text-red-800">Suspended</Badge>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold text-northium-primary">
          Recent Security Alerts
        </h2>
        <AlertsPanel />
      </div>
    </div>
  );
}
