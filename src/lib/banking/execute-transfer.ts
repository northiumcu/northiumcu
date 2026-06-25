import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptSensitive, encryptSensitive, lastFour, verifyPin } from "@/lib/auth/crypto";
import type { TransferCreateInput } from "@/lib/auth/validators";
import { postAccountTransaction } from "@/lib/banking/post-transaction";
import { notifyMember } from "@/lib/banking/member-notifications";
import {
  getActiveBillPayPayee,
  resolvePayeeAccountNumber,
} from "@/lib/banking/bill-pay";
import { buildTransferReference } from "@/lib/banking/transaction-reference";
import { formatCurrency } from "@/lib/format/currency";

export type TransferResult = {
  transfer: {
    id: string;
    type: string;
    status: string;
    amount: number;
    created_at: string;
    member_message?: string | null;
  };
  debited: boolean;
  receiptAvailable: boolean;
};

export async function executeMemberTransfer(
  admin: SupabaseClient,
  memberId: string,
  input: TransferCreateInput & { pin: string }
): Promise<TransferResult> {
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select(
      "pin_hash, cot_required, imf_required, cot_code_encrypted, imf_code_encrypted, delay_transactions, bill_pay_enabled, first_name, last_name"
    )
    .eq("id", memberId)
    .single();

  if (profileError || !profile?.pin_hash) {
    throw new Error("Profile not found.");
  }

  if (!verifyPin(input.pin, profile.pin_hash)) {
    throw new Error("Invalid account PIN.");
  }

  const { data: source, error: sourceError } = await admin
    .from("accounts")
    .select("id, member_id, available_balance, balance, status, account_number")
    .eq("id", input.sourceAccountId)
    .eq("member_id", memberId)
    .single();

  if (sourceError || !source) {
    throw new Error("Source account not found.");
  }

  if (source.status !== "active") {
    throw new Error("Source account is not active.");
  }

  validateTransferInput(input, profile.bill_pay_enabled !== false);

  const resolvedInput = await resolveTransferPayeeDetails(admin, memberId, input);

  const transferRequiresCode =
    resolvedInput.type !== "direct_deposit" &&
    resolvedInput.type !== "internal" &&
    resolvedInput.type !== "zelle";

  if (transferRequiresCode && profile.cot_required) {
    if (!resolvedInput.cotCode?.trim()) {
      throw new Error(
        "COT Code is required. Contact your Northium account officer if you do not have your code."
      );
    }
    if (!profile.cot_code_encrypted) {
      throw new Error("COT Code is not configured. Contact your account officer.");
    }
    const expected = decryptSensitive(profile.cot_code_encrypted);
    if (resolvedInput.cotCode.trim().toUpperCase() !== expected.trim().toUpperCase()) {
      throw new Error("Invalid COT Code.");
    }
  }

  if (transferRequiresCode && profile.imf_required) {
    if (!resolvedInput.imfCode?.trim()) {
      throw new Error(
        "IMF Code is required. Contact your Northium account officer if you do not have your code."
      );
    }
    if (!profile.imf_code_encrypted) {
      throw new Error("IMF Code is not configured. Contact your account officer.");
    }
    const expected = decryptSensitive(profile.imf_code_encrypted);
    if (resolvedInput.imfCode.trim().toUpperCase() !== expected.trim().toUpperCase()) {
      throw new Error("Invalid IMF Code.");
    }
  }

  if (Number(source.available_balance) < input.amount) {
    throw new Error("Insufficient available balance.");
  }

  const needsAdminApproval = profile.delay_transactions === true;
  const status = needsAdminApproval ? "pending_approval" : "completed";
  const beneficiaryLabel = buildBeneficiaryLabel(resolvedInput);

  const { data: transfer, error: transferError } = await admin
    .from("transfers")
    .insert({
      member_id: memberId,
      source_account_id: resolvedInput.sourceAccountId,
      destination_account_id: resolvedInput.destinationAccountId ?? null,
      payee_id: resolvedInput.payeeId ?? null,
      type: resolvedInput.type,
      status,
      amount: resolvedInput.amount,
      memo: resolvedInput.memo ?? null,
      beneficiary_name: resolvedInput.beneficiaryName ?? beneficiaryLabel,
      beneficiary_bank: resolvedInput.beneficiaryBank ?? null,
      destination_routing_number: resolvedInput.destinationRoutingNumber ?? null,
      destination_account_last_four: resolvedInput.destinationAccountNumber
        ? lastFour(resolvedInput.destinationAccountNumber)
        : null,
      zelle_contact: resolvedInput.zelleContact ?? null,
      wire_swift: resolvedInput.wireSwift ?? null,
      wire_iban: resolvedInput.wireIban ? encryptSensitive(resolvedInput.wireIban) : null,
      wire_country: resolvedInput.wireCountry ?? null,
      pin_verified_at: new Date().toISOString(),
      member_message: needsAdminApproval
        ? "Your transfer is pending administrator approval."
        : "Transfer completed successfully.",
      completed_at: needsAdminApproval ? null : new Date().toISOString(),
    })
    .select("id, type, status, amount, created_at, member_message")
    .single();

  if (transferError || !transfer) {
    throw new Error(transferError?.message ?? "Failed to create transfer.");
  }

  let debited = false;

  if (!needsAdminApproval) {
    const description = buildTransactionDescription(resolvedInput, beneficiaryLabel);
    try {
      await postAccountTransaction(admin, {
        accountId: source.id,
        amount: input.amount,
        direction: "debit",
        type: "transfer",
        description,
        reference: buildTransferReference(transfer.id),
        transferId: transfer.id,
      });

      if (resolvedInput.type === "internal" && resolvedInput.destinationAccountId) {
        await postAccountTransaction(admin, {
          accountId: resolvedInput.destinationAccountId,
          amount: input.amount,
          direction: "credit",
          type: "transfer",
          description: `Internal Transfer — from ••••${source.account_number.slice(-4)}`,
          reference: buildTransferReference(transfer.id),
          transferId: transfer.id,
        });
      }

      debited = true;
    } catch (debitError) {
      await admin
        .from("transfers")
        .update({
          status: "failed",
          member_message:
            "This transfer could not be completed. Please try again or contact your Northium account officer.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", transfer.id);
      throw debitError;
    }

    await notifyMember(admin, {
      userId: memberId,
      title: "Transfer completed",
      message: `Your ${formatType(resolvedInput.type)} of ${formatCurrency(resolvedInput.amount)} was processed successfully.`,
      category: "transactional",
    });
  } else {
    await notifyMember(admin, {
      userId: memberId,
      title: "Transfer pending review",
      message: `Your ${formatType(resolvedInput.type)} of ${formatCurrency(resolvedInput.amount)} is awaiting administrator approval.`,
      category: "transactional",
    });
  }

  return {
    transfer,
    debited,
    receiptAvailable: debited,
  };
}

function validateTransferInput(input: TransferCreateInput, billPayEnabled: boolean) {
  if (input.type === "bill_pay" && !billPayEnabled) {
    throw new Error("Bill Pay is currently unavailable on your account.");
  }

  if (input.type === "internal" && !input.destinationAccountId) {
    throw new Error("Destination account is required for internal transfers.");
  }

  if (input.type === "bill_pay" && !input.payeeId) {
    throw new Error("Select a payee for bill payment.");
  }

  const requiresExternal =
    input.type !== "internal" &&
    input.type !== "direct_deposit" &&
    input.type !== "zelle" &&
    input.type !== "bill_pay";

  if (requiresExternal && !input.beneficiaryName) {
    throw new Error("Beneficiary name is required.");
  }

  if (
    (input.type === "direct_deposit" ||
      input.type === "ach" ||
      input.type === "local_wire") &&
    (!input.destinationRoutingNumber || !input.destinationAccountNumber)
  ) {
    throw new Error("Routing and account numbers are required.");
  }

  if (input.type === "zelle" && !input.zelleContact) {
    throw new Error("Zelle email or mobile number is required.");
  }

  if (
    input.type === "international_wire" &&
    (!input.wireSwift || !input.wireIban || !input.wireCountry)
  ) {
    throw new Error("SWIFT, IBAN, and country are required for international wires.");
  }
}

async function resolveTransferPayeeDetails(
  admin: SupabaseClient,
  memberId: string,
  input: TransferCreateInput & { pin: string }
): Promise<TransferCreateInput & { pin: string }> {
  if (input.type !== "bill_pay") {
    return input;
  }

  const payee = await getActiveBillPayPayee(admin, memberId, input.payeeId!);
  const accountNumber = resolvePayeeAccountNumber(payee);

  return {
    ...input,
    beneficiaryName: payee.payee_name,
    destinationRoutingNumber: payee.routing_number,
    destinationAccountNumber: accountNumber,
    memo: input.memo ?? payee.nickname,
  };
}

function buildBeneficiaryLabel(input: TransferCreateInput): string {
  if (input.type === "bill_pay") return input.beneficiaryName ?? "Bill Payee";
  if (input.type === "zelle") return input.zelleContact ?? "Zelle recipient";
  if (input.beneficiaryName) return input.beneficiaryName;
  return "Recipient";
}

function buildTransactionDescription(
  input: TransferCreateInput,
  beneficiary: string
): string {
  const labels: Record<string, string> = {
    internal: "Internal Transfer",
    ach: "ACH Transfer",
    local_wire: "Wire Transfer",
    international_wire: "International Wire",
    zelle: "Zelle Payment",
    direct_deposit: "Direct Deposit",
    bill_pay: "Bill Pay",
  };
  return `${labels[input.type] ?? "Transfer"} — ${beneficiary}`;
}

function formatType(type: string): string {
  return type.replace(/_/g, " ");
}

export async function completeTransferAsAdmin(
  admin: SupabaseClient,
  transferId: string,
  actorId: string,
  decision: "approved" | "denied" | "delayed" | "pending",
  note?: string
) {
  const { data: transfer, error } = await admin
    .from("transfers")
    .select("*")
    .eq("id", transferId)
    .single();

  if (error || !transfer) {
    throw new Error("Transfer not found.");
  }

  if (transfer.status === "completed" || transfer.status === "cancelled") {
    throw new Error("Transfer is already finalized.");
  }

  if (decision === "approved") {
    const { data: source } = await admin
      .from("accounts")
      .select("id, available_balance, account_number")
      .eq("id", transfer.source_account_id)
      .single();

    if (!source) throw new Error("Source account not found.");
    if (Number(source.available_balance) < Number(transfer.amount)) {
      throw new Error("Insufficient balance to approve transfer.");
    }

    const beneficiary =
      transfer.beneficiary_name ?? transfer.zelle_contact ?? "Recipient";

    await postAccountTransaction(admin, {
      accountId: transfer.source_account_id,
      amount: Number(transfer.amount),
      direction: "debit",
      type: "transfer",
      description: `${formatType(transfer.type)} — ${beneficiary}`,
      reference: buildTransferReference(transfer.id),
      transferId: transfer.id,
    });

    if (transfer.type === "internal" && transfer.destination_account_id) {
      await postAccountTransaction(admin, {
        accountId: transfer.destination_account_id,
        amount: Number(transfer.amount),
        direction: "credit",
        type: "transfer",
        description: `Internal Transfer — approved`,
        reference: buildTransferReference(transfer.id),
        transferId: transfer.id,
      });
    }

    await admin
      .from("transfers")
      .update({
        status: "completed",
        approved_by: actorId,
        admin_decision: "approved",
        member_message: note ?? "Your transfer has been approved and processed.",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", transferId);

    await notifyMember(admin, {
      userId: transfer.member_id,
      title: "Transfer approved",
      message: note ?? `Your transfer of ${formatCurrency(Number(transfer.amount))} has been approved.`,
      category: "transactional",
    });
    return;
  }

  if (decision === "denied") {
    await admin
      .from("transfers")
      .update({
        status: "cancelled",
        approved_by: actorId,
        admin_decision: "denied",
        member_message: note ?? "Your transfer was declined by your account officer.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transferId);

    await notifyMember(admin, {
      userId: transfer.member_id,
      title: "Transfer declined",
      message: note ?? `Your transfer of ${formatCurrency(Number(transfer.amount))} was not approved.`,
      category: "transactional",
    });
    return;
  }

  const message =
    decision === "delayed"
      ? note ?? "Your transfer has been delayed for additional review."
      : note ?? "Your transfer remains pending review.";

  await admin
    .from("transfers")
    .update({
      status: "pending_approval",
      approved_by: actorId,
      admin_decision: decision,
      member_message: message,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transferId);

  await notifyMember(admin, {
    userId: transfer.member_id,
    title: decision === "delayed" ? "Transfer delayed" : "Transfer pending",
    message,
    category: "transactional",
  });
}
