export type TransferAccount = {
  id: string;
  type: string;
  account_number: string;
  status: string;
  available_balance?: number;
};

const LOAN_ACCOUNT_TYPE = "loan";
const LOAN_DESTINATION_TYPES = ["checking", "savings"] as const;
const DESTINATION_TYPE_ORDER = ["checking", "savings"] as const;

function isLoanAccountType(type: string): boolean {
  return type === LOAN_ACCOUNT_TYPE;
}

/** Allowed destination account types for an internal transfer from `sourceType`. */
export function allowedInternalDestinationTypes(sourceType: string): string[] {
  if (isLoanAccountType(sourceType)) {
    return [...LOAN_DESTINATION_TYPES];
  }
  if (sourceType === "checking") return ["savings"];
  if (sourceType === "savings") return ["checking"];
  return [];
}

export function isValidInternalTransferPair(
  sourceType: string,
  destinationType: string
): boolean {
  return allowedInternalDestinationTypes(sourceType).includes(destinationType);
}

export function formatTransferAccountLabel(
  account: Pick<TransferAccount, "type" | "account_number">
): string {
  const typeLabel = account.type.replace(/_/g, " ");
  return `${typeLabel} ••••${account.account_number.slice(-4)}`;
}

function sortDestinations(accounts: TransferAccount[]): TransferAccount[] {
  return [...accounts].sort((left, right) => {
    const leftIndex = DESTINATION_TYPE_ORDER.indexOf(
      left.type as (typeof DESTINATION_TYPE_ORDER)[number]
    );
    const rightIndex = DESTINATION_TYPE_ORDER.indexOf(
      right.type as (typeof DESTINATION_TYPE_ORDER)[number]
    );
    const safeLeft = leftIndex === -1 ? DESTINATION_TYPE_ORDER.length : leftIndex;
    const safeRight = rightIndex === -1 ? DESTINATION_TYPE_ORDER.length : rightIndex;
    return safeLeft - safeRight;
  });
}

export function listInternalDestinationAccounts(
  accounts: TransferAccount[],
  sourceAccountId: string
): TransferAccount[] {
  const source = accounts.find((account) => account.id === sourceAccountId);
  if (!source) return [];

  const allowedTypes = allowedInternalDestinationTypes(source.type);

  return sortDestinations(
    accounts.filter(
      (account) =>
        account.id !== sourceAccountId &&
        account.status === "active" &&
        allowedTypes.includes(account.type)
    )
  );
}

export function pickDefaultInternalDestination(
  accounts: TransferAccount[],
  sourceAccountId: string
): string | null {
  return listInternalDestinationAccounts(accounts, sourceAccountId)[0]?.id ?? null;
}

export function internalTransferDestinationHint(sourceType: string): string {
  if (isLoanAccountType(sourceType)) {
    return "Choose checking or savings to receive loan disbursement funds.";
  }
  if (sourceType === "checking") {
    return "Checking transfers can only go to your savings account.";
  }
  if (sourceType === "savings") {
    return "Savings transfers can only go to your checking account.";
  }
  return "No eligible destination accounts for this transfer.";
}
