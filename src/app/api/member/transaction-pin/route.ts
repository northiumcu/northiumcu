import { NextResponse } from "next/server";
import { hashPin, verifyPin } from "@/lib/auth/crypto";
import { requireActiveMemberWrite } from "@/lib/auth/require-member";
import { setTransactionPinSchema } from "@/lib/auth/validators";
import { verifyTransactionPin } from "@/lib/auth/transaction-pin";

export async function GET() {
  try {
    const auth = await requireActiveMemberWrite();
    if ("error" in auth) return auth.error;

    const { data: profile } = await auth.admin
      .from("profiles")
      .select("transaction_pin_hash")
      .eq("id", auth.user.id)
      .single();

    return NextResponse.json({
      configured: Boolean(profile?.transaction_pin_hash),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load transaction PIN status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireActiveMemberWrite();
    if ("error" in auth) return auth.error;

    const body = await request.json();
    const parsed = setTransactionPinSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      return NextResponse.json(
        { error: firstError ?? "Invalid transaction PIN details." },
        { status: 400 }
      );
    }

    const { data: profile } = await auth.admin
      .from("profiles")
      .select("pin_hash, transaction_pin_hash")
      .eq("id", auth.user.id)
      .single();

    if (!profile?.pin_hash || !verifyPin(parsed.data.accountPin, profile.pin_hash)) {
      return NextResponse.json({ error: "Invalid account PIN." }, { status: 401 });
    }

    if (profile.transaction_pin_hash) {
      if (!parsed.data.currentTransactionPin) {
        return NextResponse.json(
          { error: "Enter your current transaction PIN to change it." },
          { status: 400 }
        );
      }
      if (
        !verifyTransactionPin(
          parsed.data.currentTransactionPin,
          profile.transaction_pin_hash
        )
      ) {
        return NextResponse.json(
          { error: "Current transaction PIN is incorrect." },
          { status: 401 }
        );
      }
    }

    const { error } = await auth.admin
      .from("profiles")
      .update({
        transaction_pin_hash: hashPin(parsed.data.transactionPin),
        updated_at: new Date().toISOString(),
      })
      .eq("id", auth.user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: profile.transaction_pin_hash
        ? "Transaction PIN updated."
        : "Transaction PIN created.",
      configured: true,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not save transaction PIN.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
