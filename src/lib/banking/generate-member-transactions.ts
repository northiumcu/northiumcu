import type { SupabaseClient } from "@supabase/supabase-js";
import { postAccountTransaction } from "@/lib/banking/post-transaction";
import {
  buildDebitDescription,
  debitAmountForCategory,
  normalizeState,
  randomBetween,
} from "@/lib/banking/state-merchants";

type GenerateInput = {
  accountId: string;
  employerCompanyName: string;
  addressState: string;
  debitCount: number;
  creditCount: number;
};

type GeneratedSummary = {
  credits: number;
  debits: number;
  totalCreditAmount: number;
  totalDebitAmount: number;
  endingBalance: number;
};

type PlannedTransaction = {
  direction: "credit" | "debit";
  amount: number;
  description: string;
  type: "deposit" | "withdrawal";
  postedAt: Date;
};

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function randomPastDate(maxDaysAgo: number, minDaysAgo = 1): Date {
  const days =
    minDaysAgo + Math.floor(Math.random() * Math.max(1, maxDaysAgo - minDaysAgo));
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60), 0, 0);
  return date;
}

function payrollDates(count: number): Date[] {
  const dates: Date[] = [];
  let cursor = new Date();
  cursor.setHours(10, 0, 0, 0);

  while (dates.length < count) {
    const day = cursor.getDay();
    if (day === 3 || day === 5) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
    if (dates.length > count * 30) break;
  }

  return dates.slice(0, count);
}

function splitCreditCounts(creditCount: number): { payroll: number; other: number } {
  if (creditCount <= 0) {
    return { payroll: 0, other: 0 };
  }
  if (creditCount === 1) {
    return { payroll: 1, other: 0 };
  }

  const payroll = Math.min(
    creditCount,
    Math.max(2, Math.ceil(creditCount * 0.75))
  );
  return { payroll, other: creditCount - payroll };
}

function planCredits(
  creditCount: number,
  company: string
): PlannedTransaction[] {
  if (creditCount <= 0) return [];

  const { payroll, other } = splitCreditCounts(creditCount);
  const planned: PlannedTransaction[] = [];
  const payrollDatesList = payrollDates(payroll);

  for (const postedAt of payrollDatesList) {
    planned.push({
      direction: "credit",
      amount: randomBetween(850, 3200),
      type: "deposit",
      description: `Direct Deposit — ${company}`,
      postedAt,
    });
  }

  const otherCreditDescriptions = [
    "Mobile Check Deposit",
    "Interest Payment",
    "ACH Credit — Refund",
    "Zelle Payment Received",
  ];

  for (let i = 0; i < other; i += 1) {
    const label =
      otherCreditDescriptions[
        Math.floor(Math.random() * otherCreditDescriptions.length)
      ]!;
    planned.push({
      direction: "credit",
      amount: randomBetween(25, 450),
      type: "deposit",
      description: label,
      postedAt: randomPastDate(45, 3),
    });
  }

  return planned;
}

function planDebits(debitCount: number, state: string): PlannedTransaction[] {
  const planned: PlannedTransaction[] = [];

  for (let i = 0; i < debitCount; i += 1) {
    const description = buildDebitDescription(state);
    planned.push({
      direction: "debit",
      amount: debitAmountForCategory(description),
      type: "withdrawal",
      description: `POS Debit — ${description}`,
      postedAt: randomPastDate(60, 2),
    });
  }

  return planned;
}

function fitDebitsToAvailable(
  debits: PlannedTransaction[],
  available: number
): PlannedTransaction[] {
  if (debits.length === 0) return debits;

  const minPerDebit = 0.01;
  const maxAffordable = roundMoney(available);

  if (maxAffordable < minPerDebit * debits.length) {
    throw new Error(
      `Not enough balance for ${debits.length} debits. Add credits, fund the account, or reduce the debit count.`
    );
  }

  const rawTotal = debits.reduce((sum, tx) => sum + tx.amount, 0);
  if (rawTotal <= maxAffordable) {
    return debits;
  }

  const scale = maxAffordable / rawTotal;
  const scaled = debits.map((tx) => ({
    ...tx,
    amount: Math.max(minPerDebit, roundMoney(tx.amount * scale)),
  }));

  let total = scaled.reduce((sum, tx) => sum + tx.amount, 0);
  let index = scaled.length - 1;

  while (total > maxAffordable && index >= 0) {
    const excess = roundMoney(total - maxAffordable);
    const current = scaled[index]!;
    const nextAmount = roundMoney(current.amount - excess);

    if (nextAmount < minPerDebit) {
      current.amount = minPerDebit;
    } else {
      current.amount = nextAmount;
    }

    total = scaled.reduce((sum, tx) => sum + tx.amount, 0);
    index -= 1;
  }

  if (total > maxAffordable) {
    throw new Error(
      "Could not balance debits against available funds. Add more credits or reduce debits."
    );
  }

  return scaled;
}

async function getAccountBalance(admin: SupabaseClient, accountId: string): Promise<number> {
  const { data, error } = await admin
    .from("accounts")
    .select("available_balance")
    .eq("id", accountId)
    .single();

  if (error || !data) {
    throw new Error("Account not found.");
  }

  return Number(data.available_balance);
}

export async function generateMemberTransactions(
  admin: SupabaseClient,
  input: GenerateInput
): Promise<GeneratedSummary> {
  const state = normalizeState(input.addressState);
  const company = input.employerCompanyName.trim() || "Employer Payroll";
  const creditCount = Math.max(0, Math.floor(input.creditCount));
  const debitCount = Math.max(0, Math.floor(input.debitCount));

  if (creditCount === 0 && debitCount === 0) {
    throw new Error("Set at least one debit or credit to generate.");
  }

  const startingBalance = await getAccountBalance(admin, input.accountId);
  const credits = planCredits(creditCount, company);
  const debits = planDebits(debitCount, state);

  const totalCreditAmount = roundMoney(
    credits.reduce((sum, tx) => sum + tx.amount, 0)
  );
  const availableForDebits = roundMoney(startingBalance + totalCreditAmount);
  const fittedDebits = fitDebitsToAvailable(debits, availableForDebits);
  const totalDebitAmount = roundMoney(
    fittedDebits.reduce((sum, tx) => sum + tx.amount, 0)
  );

  const postInOrder = [
    ...credits.sort((a, b) => a.postedAt.getTime() - b.postedAt.getTime()),
    ...fittedDebits.sort((a, b) => a.postedAt.getTime() - b.postedAt.getTime()),
  ];

  for (const tx of postInOrder) {
    await postAccountTransaction(admin, {
      accountId: input.accountId,
      amount: tx.amount,
      direction: tx.direction,
      type: tx.type,
      description: tx.description,
      postedAt: tx.postedAt,
    });
  }

  const endingBalance = await getAccountBalance(admin, input.accountId);

  return {
    credits: credits.length,
    debits: fittedDebits.length,
    totalCreditAmount,
    totalDebitAmount,
    endingBalance,
  };
}
