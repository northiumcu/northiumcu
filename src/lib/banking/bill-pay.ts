import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptSensitive } from "@/lib/auth/crypto";

export type BillPayPayeeRecord = {
  id: string;
  member_id: string;
  nickname: string;
  payee_name: string;
  account_number_encrypted: string;
  account_last_four: string;
  routing_number: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Internal placeholder — routing is not collected from members for bill pay. */
export const BILL_PAY_INTERNAL_ROUTING = "000000000";

export type BillPayPayeeView = {
  id: string;
  nickname: string;
  payeeName: string;
  accountLastFour: string;
  category: string | null;
  isActive: boolean;
  createdAt: string;
};

export function toBillPayPayeeView(payee: BillPayPayeeRecord): BillPayPayeeView {
  return {
    id: payee.id,
    nickname: payee.nickname,
    payeeName: payee.payee_name,
    accountLastFour: payee.account_last_four,
    category: payee.category,
    isActive: payee.is_active,
    createdAt: payee.created_at,
  };
}

export async function getActiveBillPayPayee(
  admin: SupabaseClient,
  memberId: string,
  payeeId: string
) {
  const { data, error } = await admin
    .from("bill_pay_payees")
    .select("*")
    .eq("id", payeeId)
    .eq("member_id", memberId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error("Payee not found.");
  }

  return data as BillPayPayeeRecord;
}

export function resolvePayeeAccountNumber(payee: BillPayPayeeRecord) {
  return decryptSensitive(payee.account_number_encrypted);
}
