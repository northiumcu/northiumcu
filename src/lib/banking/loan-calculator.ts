export type MemberLoanType = "personal" | "home" | "auto" | "business";

export function getEstimatedLoanRate(loanType: MemberLoanType): number {
  if (loanType === "home") return 6.25;
  if (loanType === "auto") return 4.99;
  return 8.99;
}

export function estimateMonthlyLoanPayment(
  principal: number,
  termMonths: number,
  annualRatePercent: number
): number {
  if (principal <= 0 || termMonths <= 0) return 0;

  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate <= 0) {
    return Math.round((principal / termMonths) * 100) / 100;
  }

  const factor = Math.pow(1 + monthlyRate, termMonths);
  const payment = (principal * monthlyRate * factor) / (factor - 1);
  return Math.round(payment * 100) / 100;
}
