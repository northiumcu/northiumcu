import type { AccountType } from "@/lib/database/enums";

export const LOAN_DISBURSEMENT_DESTINATION_TYPES: AccountType[] = [
  "checking",
  "savings",
];

export function isLoanAccountType(type: string): boolean {
  return type === "loan";
}

export function canTransferFromLoanTo(type: string): boolean {
  return LOAN_DISBURSEMENT_DESTINATION_TYPES.includes(type as AccountType);
}

export function formatLoanAccountLabel(loanType?: string | null): string {
  if (!loanType) return "Loan";
  return `${loanType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Loan`;
}
