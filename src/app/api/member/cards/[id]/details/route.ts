import { NextResponse } from "next/server";
import { z } from "zod";
import { decryptSensitive } from "@/lib/auth/crypto";
import { transactionPinSchema } from "@/lib/auth/validators";
import { requireActiveMemberWrite } from "@/lib/auth/require-member";
import {
  assertTransactionPinConfigured,
  verifyTransactionPin,
} from "@/lib/auth/transaction-pin";
import { formatExpiryDisplay, formatPanDisplay } from "@/lib/banking/card-issuance";

const detailsSchema = z.object({
  pin: transactionPinSchema,
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const auth = await requireActiveMemberWrite();
    if ("error" in auth) return auth.error;

    const body = await request.json();
    const parsed = detailsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter your 4-digit transaction PIN." }, { status: 400 });
    }

    const { data: profile } = await auth.admin
      .from("profiles")
      .select("transaction_pin_hash")
      .eq("id", auth.user.id)
      .single();

    assertTransactionPinConfigured(profile?.transaction_pin_hash);
    if (!verifyTransactionPin(parsed.data.pin, profile.transaction_pin_hash)) {
      return NextResponse.json({ error: "Invalid transaction PIN." }, { status: 401 });
    }

    const { data: card, error } = await auth.admin
      .from("cards")
      .select(
        "id, member_id, status, pan_encrypted, cvv_encrypted, expires_at, cardholder_name, product_name, last_four"
      )
      .eq("id", id)
      .eq("member_id", auth.user.id)
      .single();

    if (error || !card) {
      return NextResponse.json({ error: "Card not found." }, { status: 404 });
    }

    if (card.status !== "active" || !card.pan_encrypted || !card.cvv_encrypted) {
      return NextResponse.json(
        { error: "Card details are available after your card is approved and issued." },
        { status: 400 }
      );
    }

    const pan = decryptSensitive(card.pan_encrypted);
    const cvv = decryptSensitive(card.cvv_encrypted);
    const expiresAt = card.expires_at ?? "";

    return NextResponse.json({
      card: {
        id: card.id,
        productName: card.product_name,
        cardholderName: card.cardholder_name,
        pan: formatPanDisplay(pan),
        panDigits: pan,
        cvv,
        expiry: formatExpiryDisplay(expiresAt),
        expiresAt,
        lastFour: card.last_four,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load card details.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
