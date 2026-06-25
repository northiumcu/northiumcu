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
};

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
    // Wednesday and Friday — twice per week payroll pattern
    if (day === 3 || day === 5) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
    if (dates.length > count * 30) break;
  }

  return dates.slice(0, count);
}

export async function generateMemberTransactions(
  admin: SupabaseClient,
  input: GenerateInput
): Promise<GeneratedSummary> {
  const state = normalizeState(input.addressState);
  const company = input.employerCompanyName.trim() || "Employer Payroll";
  const summary: GeneratedSummary = {
    credits: 0,
    debits: 0,
    totalCreditAmount: 0,
    totalDebitAmount: 0,
  };

  const payrollSlots =
    input.creditCount > 0
      ? Math.max(2, Math.min(input.creditCount, Math.ceil(input.creditCount * 0.75)))
      : 0;
  const payrollDatesList = payrollDates(payrollSlots);
  let otherCredits = input.creditCount - payrollSlots;

  for (const postedAt of payrollDatesList) {
    const amount = randomBetween(850, 3200);
    await postAccountTransaction(admin, {
      accountId: input.accountId,
      amount,
      direction: "credit",
      type: "deposit",
      description: `Direct Deposit — ${company}`,
      postedAt,
    });
    summary.credits += 1;
    summary.totalCreditAmount += amount;
  }

  const otherCreditDescriptions = [
    "Mobile Check Deposit",
    "Interest Payment",
    "ACH Credit — Refund",
    "Zelle Payment Received",
  ];

  while (otherCredits > 0) {
    const postedAt = randomPastDate(45, 3);
    const amount = randomBetween(25, 450);
    const label =
      otherCreditDescriptions[
        Math.floor(Math.random() * otherCreditDescriptions.length)
      ]!;
    await postAccountTransaction(admin, {
      accountId: input.accountId,
      amount,
      direction: "credit",
      type: "deposit",
      description: `${label}`,
      postedAt,
    });
    summary.credits += 1;
    summary.totalCreditAmount += amount;
    otherCredits -= 1;
  }

  for (let i = 0; i < input.debitCount; i += 1) {
    const description = buildDebitDescription(state);
    const amount = debitAmountForCategory(description);
    const postedAt = randomPastDate(60, 2);
    await postAccountTransaction(admin, {
      accountId: input.accountId,
      amount,
      direction: "debit",
      type: "withdrawal",
      description: `POS Debit — ${description}`,
      postedAt,
    });
    summary.debits += 1;
    summary.totalDebitAmount += amount;
  }

  return summary;
}
