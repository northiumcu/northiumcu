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
  await admin.from("notifications").insert({
    user_id: input.userId,
    title: input.title,
    message: input.message,
    category: input.category ?? "transactional",
    read: false,
  });
}
