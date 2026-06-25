import Link from "next/link";
import { AccountCard } from "@/components/portal/account-card";
import { LoanCard } from "@/components/portal/loan-card";
import { PortalSectionTitle } from "@/components/portal/portal-section-title";
import { TransactionTable } from "@/components/portal/transaction-table";
import { quickActions } from "@/lib/portal/theme";
import type { Account, Loan, Transaction } from "@/types/database";
import { cn } from "@/lib/utils";

interface MemberDashboardProps {
  accounts?: Account[];
  transactions?: Transaction[];
  loans?: Loan[];
}

export function MemberDashboard({
  accounts = [],
  transactions = [],
  loans = [],
}: MemberDashboardProps) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "group relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl",
                action.gradient
              )}
            >
              <div className="pointer-events-none absolute -right-4 -top-6 size-24 rounded-full bg-white/15 blur-2xl transition-transform group-hover:scale-110" />
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-base font-semibold">{action.label}</p>
                  <p className="mt-1 text-sm text-white/75">{action.description}</p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <Icon className="size-5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <div>
        <PortalSectionTitle title="Your Accounts" />
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

      <div>
        <PortalSectionTitle title="Recent Transactions" />
        <TransactionTable transactions={transactions} />
      </div>

      <div>
        <PortalSectionTitle title="Loans" />
        {loans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-northium-border/80 bg-white/70 p-8 text-center text-sm text-northium-muted backdrop-blur-sm">
            No active loans on file.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {loans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
