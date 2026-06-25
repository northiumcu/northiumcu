"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format/currency";

type DashboardStats = {
  totalMembers: number;
  activeAccounts: number;
  outstandingLoans: number;
  pendingApprovals: number;
  pendingMembershipApps: number;
  pendingTransfers: number;
  pendingCardApps: number;
  pendingLoanApps: number;
};

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setStats(data.stats ?? null);
      })
      .catch(() => setError("Could not load dashboard metrics."));
  }, []);

  const cards = stats
    ? [
        { label: "Total Members", value: stats.totalMembers.toLocaleString() },
        { label: "Active Accounts", value: stats.activeAccounts.toLocaleString() },
        {
          label: "Outstanding Loans",
          value: formatCurrency(stats.outstandingLoans),
        },
        {
          label: "Pending Approvals",
          value: stats.pendingApprovals.toLocaleString(),
        },
      ]
    : [
        { label: "Total Members", value: "—" },
        { label: "Active Accounts", value: "—" },
        { label: "Outstanding Loans", value: "—" },
        { label: "Pending Approvals", value: "—" },
      ];

  return (
    <div className="space-y-8">
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card
            key={card.label}
            className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/55">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-bold text-white">
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats && stats.pendingApprovals > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.pendingMembershipApps > 0 && (
            <QueueLink
              href="/hard/members"
              label="Membership applications"
              count={stats.pendingMembershipApps}
            />
          )}
          {stats.pendingTransfers > 0 && (
            <QueueLink
              href="/hard/transfers"
              label="Transfers awaiting approval"
              count={stats.pendingTransfers}
            />
          )}
          {stats.pendingCardApps > 0 && (
            <QueueLink
              href="/hard/cards"
              label="Card applications"
              count={stats.pendingCardApps}
            />
          )}
          {stats.pendingLoanApps > 0 && (
            <QueueLink
              href="/hard/loans"
              label="Loan applications"
              count={stats.pendingLoanApps}
            />
          )}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-[#0f2233] p-6 text-sm text-white/55">
        <p>
          Use <strong className="text-northium-gold">Member Tools</strong> for focused
          tasks — each action has its own page so funding, transfer pauses, and security
          codes are never mixed together.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <MemberToolLink href="/hard/member-tools" label="All member tools" />
          <MemberToolLink href="/hard/member-tools/fund-accounts" label="Fund accounts" />
          <MemberToolLink href="/hard/member-tools/generate-activity" label="Generate activity" />
          <MemberToolLink href="/hard/member-tools/transfer-codes" label="Transfer codes" />
        </div>
      </div>
    </div>
  );
}

function MemberToolLink({ href, label }: { href: string; label: string }) {
  return (
    <Button
      variant="outline"
      nativeButton={false}
      render={<Link href={href} />}
      className="rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10"
    >
      {label}
    </Button>
  );
}

function QueueLink({
  href,
  label,
  count,
}: {
  href: string;
  label: string;
  count: number;
}) {
  return (
    <Button
      variant="outline"
      nativeButton={false}
      render={<Link href={href} />}
      className="h-auto flex-col items-start gap-1 rounded-2xl border-northium-gold/30 bg-northium-gold/10 px-4 py-4 text-left text-white hover:bg-northium-gold/15"
    >
      <span className="font-heading text-2xl font-bold text-northium-gold">
        {count}
      </span>
      <span className="text-sm text-white/70">{label}</span>
    </Button>
  );
}
