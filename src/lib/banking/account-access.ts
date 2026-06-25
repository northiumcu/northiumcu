import type { SupabaseClient } from "@supabase/supabase-js";

export async function assertMemberOwnsAccount(
  admin: SupabaseClient,
  memberId: string,
  accountId: string
): Promise<void> {
  const { data, error } = await admin
    .from("accounts")
    .select("id")
    .eq("id", accountId)
    .eq("member_id", memberId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Account not found.");
  }
}
