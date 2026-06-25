"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AccountCard } from "@/components/portal/account-card";
import { PortalPageHeader } from "@/components/layout/portal-page-header";
import { PaginatedTransactionList } from "@/components/portal/paginated-transaction-list";
import { Button } from "@/components/ui/button";
import type { Account } from "@/types/database";

export function MemberAccountsClient() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/member/accounts")
      .then((r) => r.json())
      .then((data) => {
        setAccounts(data.accounts ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-sm text-northium-muted">Loading accounts...</p>;
  }

  return (
    <div className="space-y-8">
      <PortalPageHeader
        visual="accounts"
        title="Your Accounts"
        description="Select an account to view its activity."
      />
      {accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-northium-border/80 bg-white/70 p-8 text-center text-sm text-northium-muted backdrop-blur-sm">
          No accounts connected yet. Accounts appear here after membership activation.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              href={`/member/accounts/${account.id}`}
            />
          ))}
        </div>
      )}

      <PaginatedTransactionList
        title="All Activity"
        description="Combined activity across your accounts."
      />
    </div>
  );
}

export function MemberAccountDetailClient({ accountId }: { accountId: string }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    void fetch("/api/member/accounts")
      .then((r) => r.json())
      .then((data) => {
        const match = (data.accounts ?? []).find(
          (item: Account) => item.id === accountId
        );
        if (!match) {
          setNotFound(true);
        } else {
          setAccount(match);
        }
        setLoading(false);
      });
  }, [accountId]);

  if (loading) {
    return <p className="text-sm text-northium-muted">Loading account...</p>;
  }

  if (notFound || !account) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-northium-muted">Account not found.</p>
        <Button
          nativeButton={false}
          render={<Link href="/member/accounts" />}
          variant="outline"
        >
          Back to accounts
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button
        nativeButton={false}
        render={<Link href="/member/accounts" />}
        variant="ghost"
        className="mb-2 -ml-2 text-northium-muted hover:text-northium-primary"
      >
        <ArrowLeft className="mr-2 size-4" />
        All accounts
      </Button>

      <PortalPageHeader
        visual="accounts"
        title={`${account.type.replace(/_/g, " ")} activity`}
        description={`Transactions for account ••••${account.account_number.slice(-4)}.`}
      />

      <AccountCard account={account} />

      <PaginatedTransactionList
        accountId={accountId}
        title="Transactions"
      />
    </div>
  );
}
