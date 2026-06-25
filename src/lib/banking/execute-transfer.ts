import type { SupabaseClient } from "@supabase/supabase-js";
import {
  decryptSensitive,
  encryptSensitive,
  lastFour,
} from "@/lib/auth/crypto";
import {
  assertTransactionPinConfigured,
  verifyTransactionPin,
} from "@/lib/auth/transaction-pin";
import type { TransferCreateInput } from "@/lib/auth/validators";
import { postAccountTransaction } from "@/lib/banking/post-transaction";
import { notifyMember } from "@/lib/banking/member-notifications";
import { sendTransferStatusEmail } from "@/lib/email/member-alerts";
import {
  getActiveBillPayPayee,
  resolvePayeeAccountNumber,
} from "@/lib/banking/bill-pay";
import { buildTransferReference } from "@/lib/banking/transaction-reference";
import { formatCurrency } from "@/lib/format/currency";
import {
  executeInternalTransferLegs,
  formatTransferAccountLabel,
  loadTransferAccount,
} from "@/lib/banking/internal-transfer";
import { isValidInternalTransferPair } from "@/lib/banking/internal-transfer-helpers";
import {
  assertLoanTransferAllowed,
  isLoanAccountType,
} from "@/lib/banking/loan-accounts";
import { isValidWireCountry } from "@/lib/geo/wire-countries";
import {
  DEFAULT_TRANSFER_PAUSE_MESSAGE,
  TransferPausedError,
} from "@/lib/banking/transfer-pause";

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
      "pin_hash, transaction_pin_hash, cot_required, imf_required, cot_code_encrypted, imf_code_encrypted, delay_transactions, pause_transfers, transfer_pause_reason, bill_pay_enabled, first_name, last_name"
    )
    .eq("id", memberId)
    .single();

  if (profileError || !profile?.pin_hash) {
    throw new Error("Profile not found.");
  }

  assertTransactionPinConfigured(profile.transaction_pin_hash);

  if (!verifyTransactionPin(input.pin, profile.transaction_pin_hash)) {
    throw new Error("Invalid transaction PIN.");
  }

  const { data: source, error: sourceError } = await admin
    .from("accounts")
    .select("id, member_id, available_balance, balance, status, account_number, type")
    .eq("id", input.sourceAccountId)
    .eq("member_id", memberId)
    .single();

  if (sourceError || !source) {
    throw new Error("Source account not found.");
  }

  if (source.status !== "active") {
    throw new Error("Source account is not active.");
  }

  assertLoanTransferAllowed(source.type, input.type);

  validateTransferInput(input, profile.bill_pay_enabled !== false);

  const resolvedInput = await resolveTransferPayeeDetails(admin, memberId, input);

  if (resolvedInput.type === "internal" && resolvedInput.destinationAccountId) {
    await validateInternalDestination(
      admin,
      memberId,
      resolvedInput.destinationAccountId,
      resolvedInput.sourceAccountId
    );
  }

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

  if (profile.pause_transfers === true) {
    const pauseMessage =
      profile.transfer_pause_reason?.trim() || DEFAULT_TRANSFER_PAUSE_MESSAGE;
    throw new TransferPausedError(pauseMessage);
  }

  const needsAdminApproval = profile.delay_transactions === true;
  const status = needsAdminApproval ? "pending_approval" : "completed";

  let beneficiaryLabel = buildBeneficiaryLabel(resolvedInput);
  if (resolvedInput.type === "internal" && resolvedInput.destinationAccountId) {
    const destination = await loadTransferAccount(
      admin,
      resolvedInput.destinationAccountId,
      memberId
    );
    beneficiaryLabel = formatTransferAccountLabel(destination);
  }

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
        ? `Your ${formatType(resolvedInput.type)} of ${formatCurrency(resolvedInput.amount)} is awaiting administrator review. No funds have been deducted from your account yet.`
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
    const reference = buildTransferReference(transfer.id);
    try {
      if (resolvedInput.type === "internal" && resolvedInput.destinationAccountId) {
        await executeInternalTransferLegs(admin, {
          sourceAccountId: source.id,
          destinationAccountId: resolvedInput.destinationAccountId,
          amount: input.amount,
          debitDescription: description,
          creditDescription: `Internal Transfer — from ••••${source.account_number.slice(-4)}`,
          reference,
          transferId: transfer.id,
        });
      } else {
        await postAccountTransaction(admin, {
          accountId: source.id,
          amount: input.amount,
          direction: "debit",
          type: "transfer",
          description,
          reference,
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
    await sendTransferStatusEmail(admin, {
      memberId,
      firstName: profile.first_name?.trim() || "Member",
      status: "completed",
      transferType: resolvedInput.type,
      amount: resolvedInput.amount,
      receiver: beneficiaryLabel,
    });
  } else {
    await notifyMember(admin, {
      userId: memberId,
      title: "Transfer pending review",
      message: `Your ${formatType(resolvedInput.type)} of ${formatCurrency(resolvedInput.amount)} is awaiting administrator review. No funds have been deducted yet.`,
      category: "transactional",
    });
    await sendTransferStatusEmail(admin, {
      memberId,
      firstName: profile.first_name?.trim() || "Member",
      status: "pending",
      transferType: resolvedInput.type,
      amount: resolvedInput.amount,
      receiver: beneficiaryLabel,
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
    throw new Error("Receiver name is required.");
  }

  if (
    (input.type === "direct_deposit" ||
      input.type === "ach" ||
      input.type === "local_wire") &&
    (!input.destinationRoutingNumber || !input.destinationAccountNumber)
  ) {
    throw new Error("Routing and account numbers are required.");
  }

  if (
    (input.type === "direct_deposit" ||
      input.type === "local_wire" ||
      input.type === "international_wire") &&
    !input.beneficiaryBank?.trim()
  ) {
    throw new Error("Receiver bank name is required.");
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

  if (
    input.type === "international_wire" &&
    input.wireCountry &&
    !isValidWireCountry(input.wireCountry)
  ) {
    throw new Error("Select a valid destination country.");
  }
}

async function validateInternalDestination(
  admin: SupabaseClient,
  memberId: string,
  destinationAccountId: string,
  sourceAccountId: string
) {
  if (destinationAccountId === sourceAccountId) {
    throw new Error("Cannot transfer to the same account.");
  }

  const { data: source, error: sourceError } = await admin
    .from("accounts")
    .select("id, member_id, status, type")
    .eq("id", sourceAccountId)
    .single();

  if (sourceError || !source || source.member_id !== memberId) {
    throw new Error("Source account not found.");
  }

  if (source.status !== "active") {
    throw new Error("Source account is not active.");
  }

  const { data: destination, error } = await admin
    .from("accounts")
    .select("id, member_id, status, type")
    .eq("id", destinationAccountId)
    .single();

  if (error || !destination || destination.member_id !== memberId) {
    throw new Error("Destination account not found.");
  }

  if (destination.status !== "active") {
    throw new Error("Destination account is not active.");
  }

  if (!isValidInternalTransferPair(source.type, destination.type)) {
    if (isLoanAccountType(source.type)) {
      throw new Error("Loan funds can only be transferred to checking or savings.");
    }
    if (source.type === "checking") {
      throw new Error("Checking transfers can only go to your savings account.");
    }
    if (source.type === "savings") {
      throw new Error("Savings transfers can only go to your checking account.");
    }
    throw new Error("Transfers cannot be sent to a loan account.");
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
  const now = new Date().toISOString();

  if (decision === "approved") {
    const { data: transfer, error: claimError } = await admin
      .from("transfers")
      .update({
        status: "processing",
        updated_at: now,
      })
      .eq("id", transferId)
      .in("status", ["pending_approval", "pending"])
      .select("*")
      .maybeSingle();

    if (claimError) {
      throw new Error(claimError.message);
    }

    if (!transfer) {
      const { data: existing } = await admin
        .from("transfers")
        .select("status")
        .eq("id", transferId)
        .maybeSingle();

      if (!existing) {
        throw new Error("Transfer not found.");
      }
      throw new Error("Transfer is already finalized.");
    }

    if (transfer.type === "internal" && transfer.destination_account_id) {
      await validateInternalDestination(
        admin,
        transfer.member_id,
        transfer.destination_account_id,
        transfer.source_account_id
      );
    }

    const { data: source } = await admin
      .from("accounts")
      .select("id, available_balance, account_number")
      .eq("id", transfer.source_account_id)
      .single();

    if (!source) {
      await admin
        .from("transfers")
        .update({
          status: "pending_approval",
          updated_at: now,
        })
        .eq("id", transferId);
      throw new Error("Source account not found.");
    }

    if (Number(source.available_balance) < Number(transfer.amount)) {
      await admin
        .from("transfers")
        .update({
          status: "pending_approval",
          member_message:
            "Insufficient balance to complete this transfer. Please add funds or contact your account officer.",
          updated_at: now,
        })
        .eq("id", transferId);
      throw new Error("Insufficient balance to approve transfer.");
    }

    const beneficiary =
      transfer.beneficiary_name ?? transfer.zelle_contact ?? "Recipient";
    const reference = buildTransferReference(transfer.id);

    try {
      if (transfer.type === "internal" && transfer.destination_account_id) {
        await executeInternalTransferLegs(admin, {
          sourceAccountId: transfer.source_account_id,
          destinationAccountId: transfer.destination_account_id,
          amount: Number(transfer.amount),
          debitDescription: `${formatType(transfer.type)} — ${beneficiary}`,
          creditDescription: `Internal Transfer — approved`,
          reference,
          transferId: transfer.id,
        });
      } else {
        await postAccountTransaction(admin, {
          accountId: transfer.source_account_id,
          amount: Number(transfer.amount),
          direction: "debit",
          type: "transfer",
          description: `${formatType(transfer.type)} — ${beneficiary}`,
          reference,
          transferId: transfer.id,
        });
      }
    } catch (debitError) {
      await admin
        .from("transfers")
        .update({
          status: "pending_approval",
          member_message:
            "This transfer could not be completed. Please try again or contact your account officer.",
          updated_at: now,
        })
        .eq("id", transferId);
      throw debitError;
    }

    await admin
      .from("transfers")
      .update({
        status: "completed",
        approved_by: actorId,
        admin_decision: "approved",
        member_message: note ?? "Your transfer has been approved and processed.",
        completed_at: now,
        updated_at: now,
      })
      .eq("id", transferId);

    const { data: memberProfile } = await admin
      .from("profiles")
      .select("first_name")
      .eq("id", transfer.member_id)
      .single();

    const approvalNote = note ?? "Your transfer has been approved and processed.";
    await notifyMember(admin, {
      userId: transfer.member_id,
      title: "Transfer approved",
      message: approvalNote,
      category: "transactional",
    });
    await sendTransferStatusEmail(admin, {
      memberId: transfer.member_id,
      firstName: memberProfile?.first_name?.trim() || "Member",
      status: "approved",
      transferType: transfer.type,
      amount: Number(transfer.amount),
      receiver: beneficiary,
      note: approvalNote,
    });
    return;
  }

  if (decision === "denied") {
    const { data: transfer, error: denyError } = await admin
      .from("transfers")
      .update({
        status: "cancelled",
        approved_by: actorId,
        admin_decision: "denied",
        member_message: note ?? "Your transfer was declined by your account officer.",
        updated_at: now,
      })
      .eq("id", transferId)
      .in("status", ["pending_approval", "pending", "processing"])
      .select("member_id, amount, type")
      .maybeSingle();

    if (denyError) {
      throw new Error(denyError.message);
    }

    if (!transfer) {
      const { data: existing } = await admin
        .from("transfers")
        .select("status")
        .eq("id", transferId)
        .maybeSingle();

      if (!existing) {
        throw new Error("Transfer not found.");
      }
      throw new Error("Transfer is already finalized.");
    }

    const declineNote =
      note ?? `Your transfer of ${formatCurrency(Number(transfer.amount))} was not approved.`;

    await notifyMember(admin, {
      userId: transfer.member_id,
      title: "Transfer declined",
      message: declineNote,
      category: "transactional",
    });

    const { data: memberProfile } = await admin
      .from("profiles")
      .select("first_name")
      .eq("id", transfer.member_id)
      .single();

    await sendTransferStatusEmail(admin, {
      memberId: transfer.member_id,
      firstName: memberProfile?.first_name?.trim() || "Member",
      status: "declined",
      transferType: transfer.type ?? "transfer",
      amount: Number(transfer.amount),
      note: declineNote,
    });
    return;
  }

  const { data: transfer, error } = await admin
    .from("transfers")
    .select("member_id, amount, status, type")
    .eq("id", transferId)
    .single();

  if (error || !transfer) {
    throw new Error("Transfer not found.");
  }

  if (transfer.status === "completed" || transfer.status === "cancelled") {
    throw new Error("Transfer is already finalized.");
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
      updated_at: now,
    })
    .eq("id", transferId)
    .in("status", ["pending_approval", "pending", "processing"]);

  await notifyMember(admin, {
    userId: transfer.member_id,
    title: decision === "delayed" ? "Transfer delayed" : "Transfer pending",
    message,
    category: "transactional",
  });

  const { data: memberProfile } = await admin
    .from("profiles")
    .select("first_name")
    .eq("id", transfer.member_id)
    .single();

  await sendTransferStatusEmail(admin, {
    memberId: transfer.member_id,
    firstName: memberProfile?.first_name?.trim() || "Member",
    status: decision === "delayed" ? "delayed" : "pending",
    transferType: transfer.type ?? "transfer",
    amount: Number(transfer.amount),
    note: message,
  });
}
