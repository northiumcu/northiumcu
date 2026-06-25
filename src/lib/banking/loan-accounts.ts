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

export function loanAccountAllowsTransferType(transferType: string): boolean {
  return transferType === "internal";
}

export function assertLoanTransferAllowed(
  sourceAccountType: string,
  transferType: string
): void {
  if (
    isLoanAccountType(sourceAccountType) &&
    !loanAccountAllowsTransferType(transferType)
  ) {
    throw new Error(
      "Loan disbursement accounts can only send internal transfers to checking or savings."
    );
  }
}

export function formatLoanAccountLabel(loanType?: string | null): string {
  if (!loanType) return "Loan";
  return `${loanType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Loan`;
}
