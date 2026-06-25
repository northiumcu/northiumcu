import type { SupabaseClient } from "@supabase/supabase-js";
import type { TransactionType } from "@/lib/database/enums";
import { buildTransactionReference } from "@/lib/banking/transaction-reference";
import { sendPostedTransactionEmail } from "@/lib/email/member-alerts";

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
  /** Skip member email (e.g. admin-generated historical activity). */
  skipMemberEmail?: boolean;
};

type RpcResult = {
  transaction: {
    id: string;
    amount: number;
    type: string;
    description: string;
    posted_at: string;
    created_at: string;
  };
  balance: number;
  available_balance: number;
};

export async function postAccountTransaction(
  admin: SupabaseClient,
  input: PostTransactionInput
) {
  const amount = Math.round(input.amount * 100) / 100;
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  const txType: TransactionType =
    input.type ??
    (input.direction === "credit" ? "deposit" : "withdrawal");

  const postedAt = (input.postedAt ?? new Date()).toISOString();

  const { data, error } = await admin.rpc("post_account_transaction", {
    p_account_id: input.accountId,
    p_amount: amount,
    p_direction: input.direction,
    p_type: txType,
    p_description: input.description,
    p_reference: input.reference ?? buildTransactionReference(),
    p_transfer_id: input.transferId ?? null,
    p_posted_at: postedAt,
  });

  if (error) {
    throw new Error(error.message);
  }

  const result = data as RpcResult | null;
  if (!result?.transaction) {
    throw new Error("Failed to post transaction.");
  }

  const shouldEmail =
    !input.skipMemberEmail &&
    !(txType === "transfer" && input.direction === "debit");

  if (shouldEmail) {
    await notifyPostedTransaction(admin, input, result);
  }

  return {
    transaction: result.transaction,
    balance: Number(result.balance),
    available_balance: Number(result.available_balance),
  };
}

async function notifyPostedTransaction(
  admin: SupabaseClient,
  input: PostTransactionInput,
  result: RpcResult
) {
  const { data: account } = await admin
    .from("accounts")
    .select("member_id, account_number")
    .eq("id", input.accountId)
    .single();

  if (!account?.member_id || !account.account_number) return;

  const { data: profile } = await admin
    .from("profiles")
    .select("first_name")
    .eq("id", account.member_id)
    .single();

  await sendPostedTransactionEmail(admin, {
    memberId: account.member_id,
    firstName: profile?.first_name?.trim() || "Member",
    accountLastFour: account.account_number.slice(-4),
    direction: input.direction,
    amount: input.amount,
    description: input.description,
    postedAt: result.transaction.posted_at,
  });
}
