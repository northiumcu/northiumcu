import type { SupabaseClient } from "@supabase/supabase-js";

type NotifyInput = {
  userId: string;
  title: string;
  message: string;
  category?: string;
};

export async function notifyMember(
  admin: SupabaseClient,
  input: NotifyInput
) {
  const { error } = await admin.from("notifications").insert({
    user_id: input.userId,
    title: input.title,
    message: input.message,
    category: input.category ?? "transactional",
    read: false,
  });

  if (error) {
    console.error("notifyMember failed:", error.message);
  }
}

/** Fire-and-forget member notification — never blocks transfer completion. */
export function notifyMemberAsync(admin: SupabaseClient, input: NotifyInput) {
  void notifyMember(admin, input);
}
