import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireActiveMemberWrite, requireAuthenticatedMember } from "@/lib/auth/require-member";
import { verifyPin } from "@/lib/auth/crypto";
import { pinSchema } from "@/lib/auth/validators";
import { postAccountTransaction } from "@/lib/banking/post-transaction";
import { MASTERCARD_FEE } from "@/lib/banking/member-products";
import { notifyMember } from "@/lib/banking/member-notifications";
import { maskedPanFromLastFour } from "@/lib/banking/card-issuance";
import { formatCurrency } from "@/lib/format/currency";

const applySchema = z.object({
  sourceAccountId: z.string().uuid(),
  pin: pinSchema,
});

function randomLastFour() {
  return "0000";
}

function deliveryEta() {
  const days = 7 + Math.floor(Math.random() * 24);
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const auth = await requireAuthenticatedMember();
    if ("error" in auth) return auth.error;

    const { data, error } = await auth.admin
      .from("cards")
      .select(
        "id, card_type, product_name, cardholder_name, last_four, status, delivery_eta, design_variant, linked_account_id, expires_at, pan_encrypted, created_at"
      )
      .eq("member_id", auth.user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const cards = (data ?? []).map(({ pan_encrypted, ...card }) => ({
      ...card,
      detailsAvailable:
        card.status === "active" && Boolean(pan_encrypted),
      maskedPan:
        card.status === "active" && card.last_four !== "0000"
          ? maskedPanFromLastFour(card.last_four)
          : null,
    }));

    return NextResponse.json({ cards });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid application." }, { status: 400 });
    }

    const auth = await requireActiveMemberWrite();
    if ("error" in auth) return auth.error;

    const admin = createAdminClient();
    const userId = auth.user.id;
    const { data: profile } = await admin
      .from("profiles")
      .select("pin_hash, first_name, last_name")
      .eq("id", userId)
      .single();

    if (!profile?.pin_hash || !verifyPin(parsed.data.pin, profile.pin_hash)) {
      return NextResponse.json({ error: "Invalid account PIN." }, { status: 401 });
    }

    const { data: account } = await admin
      .from("accounts")
      .select("id, available_balance, status")
      .eq("id", parsed.data.sourceAccountId)
      .eq("member_id", userId)
      .single();

    if (!account || account.status !== "active") {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    if (Number(account.available_balance) < MASTERCARD_FEE) {
      return NextResponse.json(
        { error: `Insufficient balance. ${formatCurrency(MASTERCARD_FEE)} required for card processing.` },
        { status: 400 }
      );
    }

    const { data: existing } = await admin
      .from("cards")
      .select("id")
      .eq("member_id", userId)
      .eq("product_name", "Northium Mastercard")
      .in("status", ["ordered", "issued", "pending_activation", "active"])
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You already have a Northium Mastercard application or card on file." },
        { status: 400 }
      );
    }

    await postAccountTransaction(admin, {
      accountId: account.id,
      amount: MASTERCARD_FEE,
      direction: "debit",
      type: "fee",
      description: "Northium Mastercard — application & delivery fee",
    });

    const lastFour = randomLastFour();
    const { data: card, error: cardError } = await admin
      .from("cards")
      .insert({
        member_id: userId,
        linked_account_id: account.id,
        card_type: "mastercard",
        product_name: "Northium Mastercard",
        cardholder_name: `${profile.first_name} ${profile.last_name}`.trim(),
        last_four: lastFour,
        status: "ordered",
        application_fee_paid: true,
        design_variant: "northium_gold",
        delivery_eta: deliveryEta(),
      })
      .select("id, status, last_four, delivery_eta, product_name, design_variant")
      .single();

    if (cardError || !card) {
      return NextResponse.json({ error: cardError?.message }, { status: 500 });
    }

    await notifyMember(admin, {
      userId: userId,
      title: "Mastercard application received",
      message: `Your Northium Mastercard application was received and is pending review by Northium.`,
      category: "transactional",
    });

    return NextResponse.json({ card, fee: MASTERCARD_FEE });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Application failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
