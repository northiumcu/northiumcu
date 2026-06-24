import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptSensitive, lastFour } from "@/lib/auth/crypto";
import { transferCreateSchema } from "@/lib/auth/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = transferCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const input = parsed.data;
    const admin = createAdminClient();

    const { data: source, error: sourceError } = await admin
      .from("accounts")
      .select("id, member_id, available_balance, status")
      .eq("id", input.sourceAccountId)
      .eq("member_id", user.id)
      .single();

    if (sourceError || !source) {
      return NextResponse.json({ error: "Source account not found." }, { status: 404 });
    }

    if (source.status !== "active") {
      return NextResponse.json({ error: "Source account is not active." }, { status: 400 });
    }

    if (Number(source.available_balance) < input.amount) {
      return NextResponse.json({ error: "Insufficient available balance." }, { status: 400 });
    }

    const requiresExternal =
      input.type !== "internal" && input.type !== "direct_deposit";

    if (input.type === "internal" && !input.destinationAccountId) {
      return NextResponse.json(
        { error: "Destination account is required for internal transfers." },
        { status: 400 }
      );
    }

    if (requiresExternal && !input.beneficiaryName) {
      return NextResponse.json(
        { error: "Beneficiary name is required." },
        { status: 400 }
      );
    }

    if (
      (input.type === "ach" || input.type === "local_wire") &&
      (!input.destinationRoutingNumber || !input.destinationAccountNumber)
    ) {
      return NextResponse.json(
        { error: "Routing and account numbers are required." },
        { status: 400 }
      );
    }

    if (input.type === "zelle" && !input.zelleContact) {
      return NextResponse.json(
        { error: "Zelle email or mobile number is required." },
        { status: 400 }
      );
    }

    if (
      input.type === "international_wire" &&
      (!input.wireSwift || !input.wireIban || !input.wireCountry)
    ) {
      return NextResponse.json(
        { error: "SWIFT, IBAN, and country are required for international wires." },
        { status: 400 }
      );
    }

    const status =
      input.type === "local_wire" || input.type === "international_wire"
        ? "pending_approval"
        : "processing";

    const { data: transfer, error: transferError } = await admin
      .from("transfers")
      .insert({
        member_id: user.id,
        source_account_id: input.sourceAccountId,
        destination_account_id: input.destinationAccountId ?? null,
        type: input.type,
        status,
        amount: input.amount,
        memo: input.memo ?? null,
        beneficiary_name: input.beneficiaryName ?? null,
        beneficiary_bank: input.beneficiaryBank ?? null,
        destination_routing_number: input.destinationRoutingNumber ?? null,
        destination_account_last_four: input.destinationAccountNumber
          ? lastFour(input.destinationAccountNumber)
          : null,
        zelle_contact: input.zelleContact ?? null,
        wire_swift: input.wireSwift ?? null,
        wire_iban: input.wireIban ? encryptSensitive(input.wireIban) : null,
        wire_country: input.wireCountry ?? null,
      })
      .select("id, type, status, amount, created_at")
      .single();

    if (transferError || !transfer) {
      return NextResponse.json({ error: transferError?.message }, { status: 500 });
    }

    if (status === "processing") {
      await admin
        .from("accounts")
        .update({
          available_balance: Number(source.available_balance) - input.amount,
        })
        .eq("id", source.id);
    }

    return NextResponse.json({ transfer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transfer failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
