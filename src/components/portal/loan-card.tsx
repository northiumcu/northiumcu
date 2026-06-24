import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Loan } from "@/types/database";

const loanLabels: Record<Loan["loan_type"], string> = {
  auto: "Auto Loan",
  personal: "Personal Loan",
  home: "Home Loan",
  business: "Business Loan",
  student: "Student Loan",
};

interface LoanCardProps {
  loan: Loan;
}

export function LoanCard({ loan }: LoanCardProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(loan.outstanding_balance);

  const isPending = ["application", "underwriting", "approved"].includes(
    loan.status
  );

  return (
    <Card className="rounded-2xl border-northium-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold text-northium-primary">
          {loanLabels[loan.loan_type]}
        </CardTitle>
        <Badge
          variant="secondary"
          className={
            loan.status === "active"
              ? "bg-northium-success/10 text-northium-success"
              : isPending
                ? "bg-northium-gold/10 text-northium-gold"
                : ""
          }
        >
          {loan.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-2xl font-bold text-northium-primary">
          {formatted}
        </p>
        <p className="mt-1 text-sm text-northium-muted">
          {loan.term_months} month term
        </p>
      </CardContent>
    </Card>
  );
}
