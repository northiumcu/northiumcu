import { Badge } from "@/components/ui/badge";
import type { Loan } from "@/types/database";
import { formatCurrency } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

const loanLabels: Record<Loan["loan_type"], string> = {
  auto: "Auto Loan",
  personal: "Personal Loan",
  home: "Home Loan",
  business: "Business Loan",
  student: "Student Loan",
};

const loanGradients: Record<Loan["loan_type"], string> = {
  auto: "from-blue-600 to-indigo-700",
  personal: "from-violet-600 to-purple-700",
  home: "from-emerald-600 to-teal-700",
  business: "from-slate-700 to-northium-primary",
  student: "from-amber-500 to-orange-600",
};

interface LoanCardProps {
  loan: Loan;
}

export function LoanCard({ loan }: LoanCardProps) {
  const formatted = formatCurrency(loan.outstanding_balance);

  const isPending = ["application", "underwriting", "approved"].includes(loan.status);

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg",
        loanGradients[loan.loan_type]
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-white/15 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white/80">{loanLabels[loan.loan_type]}</p>
          <p className="mt-3 font-heading text-3xl font-bold">{formatted}</p>
          <p className="mt-2 text-sm text-white/75">{loan.term_months} month term</p>
        </div>
        <Badge
          className={cn(
            "border-white/20",
            loan.status === "active"
              ? "bg-white/15 text-white"
              : isPending
                ? "bg-amber-300/20 text-amber-100"
                : "bg-white/10 text-white/80"
          )}
        >
          {loan.status}
        </Badge>
      </div>
    </article>
  );
}
