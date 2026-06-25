import type { SupabaseClient } from "@supabase/supabase-js";
import type { TransactionType } from "@/lib/database/enums";

type PostDirection = "credit" | "debit";

type PostTransactionInput = {
  accountId: string;
  amount: number;
  direction: PostDirection;
  description: string;
  type?: TransactionType;
  reference?: string;
  postedAt?: Date;
  transferId?: string;
};

export async function postAccountTransaction(
  admin: SupabaseClient,
  input: PostTransactionInput
) {
  const amount = Math.round(input.amount * 100) / 100;
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const { data: account, error: accountError } = await admin
    .from("accounts")
    .select("id, balance, available_balance, status")
    .eq("id", input.accountId)
    .single();

  if (accountError || !account) {
    throw new Error("Account not found.");
  }

  if (account.status !== "active") {
    throw new Error("Account is not active.");
  }

  const balance = Number(account.balance);
  const available = Number(account.available_balance);
  const delta = input.direction === "credit" ? amount : -amount;
  const nextBalance = Math.round((balance + delta) * 100) / 100;
  const nextAvailable = Math.round((available + delta) * 100) / 100;

  if (nextBalance < 0 || nextAvailable < 0) {
    throw new Error("Insufficient balance for this debit.");
  }

  const txType: TransactionType =
    input.type ??
    (input.direction === "credit" ? "deposit" : "withdrawal");

  const postedAt = (input.postedAt ?? new Date()).toISOString();

  const { data: transaction, error: txError } = await admin
    .from("transactions")
    .insert({
      account_id: input.accountId,
      amount,
      type: txType,
      status: "posted",
      description: input.description,
      reference: input.reference ?? null,
      transfer_id: input.transferId ?? null,
      posted_at: postedAt,
    })
    .select("id, amount, type, description, posted_at, created_at")
    .single();

  if (txError || !transaction) {
    throw new Error(txError?.message ?? "Failed to post transaction.");
  }

  const { error: updateError } = await admin
    .from("accounts")
    .update({
      balance: nextBalance,
      available_balance: nextAvailable,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.accountId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    transaction,
    balance: nextBalance,
    available_balance: nextAvailable,
  };
}
