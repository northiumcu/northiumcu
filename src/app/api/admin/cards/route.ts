import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";

export async function GET() {
  try {
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;
    const { admin } = auth;

    const { data, error } = await admin
      .from("cards")
      .select(
        `
        id,
        member_id,
        card_type,
        product_name,
        cardholder_name,
        last_four,
        status,
        delivery_eta,
        application_fee_paid,
        linked_account_id,
        expires_at,
        approved_at,
        created_at
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const memberIds = [...new Set((data ?? []).map((card) => card.member_id))];
    let profileMap = new Map<string, {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      member_number: string | null;
    }>();

    if (memberIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, first_name, last_name, email, member_number")
        .in("id", memberIds);
      profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    }

    const cards = (data ?? []).map((card) => ({
      ...card,
      member: profileMap.get(card.member_id) ?? null,
    }));

    return NextResponse.json({ cards });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load cards.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
