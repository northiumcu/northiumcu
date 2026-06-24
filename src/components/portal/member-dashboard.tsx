import Link from "next/link";
import { ArrowLeftRight, CreditCard, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountCard } from "@/components/portal/account-card";
import { AlertsPanel } from "@/components/portal/alerts-panel";
import { LoanCard } from "@/components/portal/loan-card";
import { TransactionTable } from "@/components/portal/transaction-table";
import type { Account, Loan, Transaction } from "@/types/database";

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
      <div className="flex flex-wrap gap-3">
        <Button
          className="bg-northium-primary hover:bg-northium-secondary"
          render={<Link href="/member/transfers" />}
        >
          <ArrowLeftRight className="size-4" />
          Transfer Funds
        </Button>
        <Button variant="outline" render={<Link href="/member/cards" />}>
          <CreditCard className="size-4" />
          Manage Cards
        </Button>
        <Button variant="outline" render={<Link href="/member/statements" />}>
          <FileText className="size-4" />
          View Statements
        </Button>
      </div>

      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold text-northium-primary">
          Accounts
        </h2>
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

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 font-heading text-lg font-semibold text-northium-primary">
            Recent Transactions
          </h2>
          <TransactionTable transactions={transactions} />
        </div>
        <div>
          <h2 className="mb-4 font-heading text-lg font-semibold text-northium-primary">
            Security Alerts
          </h2>
          <AlertsPanel />
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold text-northium-primary">
          Loans
        </h2>
        {loans.length === 0 ? (
          <div className="rounded-2xl border border-northium-border bg-white p-8 text-center text-sm text-northium-muted">
            No active loans on file.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
