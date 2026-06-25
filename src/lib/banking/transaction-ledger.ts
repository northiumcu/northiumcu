export function transactionLedgerType(tx: {
  type: string;
  ledger_direction?: string | null;
}): "credit" | "debit" {
  if (tx.ledger_direction === "credit" || tx.ledger_direction === "debit") {
    return tx.ledger_direction;
  }

  const creditTypes = new Set(["deposit", "interest", "refund"]);
  return creditTypes.has(tx.type) ? "credit" : "debit";
}
