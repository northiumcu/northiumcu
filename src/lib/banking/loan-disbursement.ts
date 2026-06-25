import type { SupabaseClient } from "@supabase/supabase-js";

export async function disburseApprovedLoan(
  admin: SupabaseClient,
  loanId: string
): Promise<string> {
  const { data, error } = await admin.rpc("disburse_loan", {
    p_loan_id: loanId,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Failed to disburse loan.");
  }

  return String(data);
}
