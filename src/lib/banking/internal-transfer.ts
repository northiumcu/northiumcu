import type { SupabaseClient } from "@supabase/supabase-js";
import { postAccountTransaction } from "@/lib/banking/post-transaction";
import {
  formatTransferAccountLabel,
  type TransferAccount,
} from "@/lib/banking/internal-transfer-helpers";

export {
  formatTransferAccountLabel,
  listInternalDestinationAccounts,
  pickDefaultInternalDestination,
  type TransferAccount,
} from "@/lib/banking/internal-transfer-helpers";

export async function loadTransferAccount(
  admin: SupabaseClient,
  accountId: string,
  memberId: string
): Promise<TransferAccount> {
  const { data, error } = await admin
    .from("accounts")
    .select("id, member_id, type, account_number, status")
    .eq("id", accountId)
    .single();

  if (error || !data || data.member_id !== memberId) {
    throw new Error("Account not found.");
  }

  return {
    id: data.id,
    type: data.type,
    account_number: data.account_number,
    status: data.status,
  };
}

export async function executeInternalTransferLegs(
  admin: SupabaseClient,
  input: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    debitDescription: string;
    creditDescription: string;
    reference: string;
    transferId: string;
  }
) {
  const { data, error } = await admin.rpc("execute_internal_transfer", {
    p_source_account_id: input.sourceAccountId,
    p_destination_account_id: input.destinationAccountId,
    p_amount: input.amount,
    p_debit_description: input.debitDescription,
    p_credit_description: input.creditDescription,
    p_reference: input.reference,
    p_transfer_id: input.transferId,
  });

  if (error) {
    if (isMissingInternalTransferRpc(error.message)) {
      return executeInternalTransferFallback(admin, input);
    }
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Internal transfer could not be completed.");
  }

  return data;
}

function isMissingInternalTransferRpc(message: string): boolean {
  return (
    /execute_internal_transfer/i.test(message) &&
    /does not exist|could not find/i.test(message)
  );
}

async function executeInternalTransferFallback(
  admin: SupabaseClient,
  input: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    debitDescription: string;
    creditDescription: string;
    reference: string;
    transferId: string;
  }
) {
  await postAccountTransaction(admin, {
    accountId: input.sourceAccountId,
    amount: input.amount,
    direction: "debit",
    type: "transfer",
    description: input.debitDescription,
    reference: input.reference,
    transferId: input.transferId,
  });

  await postAccountTransaction(admin, {
    accountId: input.destinationAccountId,
    amount: input.amount,
    direction: "credit",
    type: "transfer",
    description: input.creditDescription,
    reference: `${input.reference}-CR`,
    transferId: input.transferId,
  });

  return { fallback: true };
}
