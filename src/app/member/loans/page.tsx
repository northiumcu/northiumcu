import { LoanCard } from "@/components/portal/loan-card";
import type { Loan } from "@/types/database";

export default function MemberLoansPage() {
  const loans: Loan[] = [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-northium-primary">
          Your Loans
        </h1>
        <p className="mt-1 text-northium-muted">
          View loan balances, payment schedules, and application status.
        </p>
      </div>
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
  );
}
