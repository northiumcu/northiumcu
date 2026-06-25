import { AccountCard } from "@/components/portal/account-card";
import { PortalPageHeader } from "@/components/layout/portal-page-header";
import type { Account } from "@/types/database";

export default function MemberAccountsPage() {
  const accounts: Account[] = [];

  return (
    <div className="space-y-8">
      <PortalPageHeader
        visual="accounts"
        title="Your Accounts"
        description="View balances and manage your Northium accounts."
      />
      {accounts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-northium-border/80 bg-white/70 p-8 text-center text-sm text-northium-muted backdrop-blur-sm">
          No accounts connected yet. Accounts appear here after membership activation.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
