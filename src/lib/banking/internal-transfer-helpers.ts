import {
  canTransferFromLoanTo,
  isLoanAccountType,
} from "@/lib/banking/loan-accounts";

export type TransferAccount = {
  id: string;
  type: string;
  account_number: string;
  status: string;
  available_balance?: number;
};

export function formatTransferAccountLabel(
  account: Pick<TransferAccount, "type" | "account_number">
): string {
  const typeLabel = account.type.replace(/_/g, " ");
  return `${typeLabel} ••••${account.account_number.slice(-4)}`;
}

export function listInternalDestinationAccounts(
  accounts: TransferAccount[],
  sourceAccountId: string
): TransferAccount[] {
  const source = accounts.find((account) => account.id === sourceAccountId);
  const others = accounts.filter((account) => account.id !== sourceAccountId);

  if (source && isLoanAccountType(source.type)) {
    return others.filter(
      (account) =>
        account.status === "active" && canTransferFromLoanTo(account.type)
    );
  }

  return others.filter(
    (account) => account.status === "active" && !isLoanAccountType(account.type)
  );
}

export function pickDefaultInternalDestination(
  accounts: TransferAccount[],
  sourceAccountId: string
): string | null {
  return listInternalDestinationAccounts(accounts, sourceAccountId)[0]?.id ?? null;
}
