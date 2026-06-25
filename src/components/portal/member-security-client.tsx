"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertsPanel } from "@/components/portal/alerts-panel";

export function MemberSecurityClient() {
  const [profile, setProfile] = useState<{
    email: string;
    member_status: string;
  } | null>(null);

  useEffect(() => {
    void fetch("/api/member/profile")
      .then((r) => r.json())
      .then((data) => setProfile(data.profile ?? null));
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
              6-digit PIN. There is no separate authenticator app to configure.
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
              Your 6-digit PIN authorizes transfers, bill payments, and card
              actions. Reset it anytime from the sign-in page if you forget it.
            </p>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/sign-in" />}
              className="rounded-xl border-sky-200"
            >
              Reset PIN from Sign In
            </Button>
          </CardContent>
        </Card>
      </div>

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
