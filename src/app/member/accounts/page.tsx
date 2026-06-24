import { AccountCard } from "@/components/portal/account-card";
import type { Account } from "@/types/database";

export default function MemberAccountsPage() {
  const accounts: Account[] = [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-northium-primary">
          Your Accounts
        </h1>
        <p className="mt-1 text-northium-muted">
          View balances and manage your Northium accounts.
        </p>
      </div>
      {accounts.length === 0 ? (
        <div className="rounded-2xl border border-northium-border bg-white p-8 text-center text-sm text-northium-muted">
          No accounts connected. Account data will appear after membership
          activation.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
