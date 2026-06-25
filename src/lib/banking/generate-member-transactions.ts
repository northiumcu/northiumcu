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
  periodStart: string;
  periodEnd: string;
};

type GeneratedSummary = {
  credits: number;
  debits: number;
  totalCreditAmount: number;
  totalDebitAmount: number;
  endingBalance: number;
  periodStart: string;
  periodEnd: string;
};

type PlannedTransaction = {
  direction: "credit" | "debit";
  amount: number;
  description: string;
  type: "deposit" | "withdrawal";
  postedAt: Date;
};

type DateRange = {
  start: Date;
  end: Date;
};

const MAX_RANGE_DAYS = 3650;

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultPeriodEnd(): string {
  return formatCalendarDate(new Date());
}

function defaultPeriodStart(): string {
  const date = new Date();
  date.setDate(date.getDate() - 60);
  return formatCalendarDate(date);
}

export function defaultActivityPeriod(): { periodStart: string; periodEnd: string } {
  return {
    periodStart: defaultPeriodStart(),
    periodEnd: defaultPeriodEnd(),
  };
}

function parseCalendarDate(value: string, boundary: "start" | "end"): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    throw new Error("Use a valid date in YYYY-MM-DD format.");
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    throw new Error("Use a valid calendar date.");
  }

  if (boundary === "start") {
    date.setHours(0, 0, 0, 0);
  } else {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

export function resolveActivityPeriod(
  periodStart?: string,
  periodEnd?: string
): DateRange {
  const startValue = periodStart?.trim() || defaultPeriodStart();
  const endValue = periodEnd?.trim() || defaultPeriodEnd();
  const start = parseCalendarDate(startValue, "start");
  const end = parseCalendarDate(endValue, "end");

  if (start.getTime() > end.getTime()) {
    throw new Error("Activity period start must be on or before the end date.");
  }

  const rangeDays =
    Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (rangeDays > MAX_RANGE_DAYS) {
    throw new Error(`Activity period cannot exceed ${MAX_RANGE_DAYS} days.`);
  }

  return { start, end };
}

function dateKey(date: Date): string {
  return formatCalendarDate(date);
}

function withRandomTime(
  date: Date,
  hourMin: number,
  hourMax: number
): Date {
  const next = new Date(date);
  const hourSpan = Math.max(1, hourMax - hourMin);
  next.setHours(
    hourMin + Math.floor(Math.random() * hourSpan),
    Math.floor(Math.random() * 60),
    0,
    0
  );
  return next;
}

function clampToRange(date: Date, range: DateRange): Date {
  if (date.getTime() < range.start.getTime()) return new Date(range.start);
  if (date.getTime() > range.end.getTime()) return new Date(range.end);
  return date;
}

function collectPayrollDays(range: DateRange): Date[] {
  const days: Date[] = [];
  const cursor = new Date(range.end);
  cursor.setHours(10, 0, 0, 0);

  while (cursor.getTime() >= range.start.getTime()) {
    const day = cursor.getDay();
    if (day === 3 || day === 5) {
      days.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return days.reverse();
}

function pickEvenlySpacedDates(pool: Date[], count: number): Date[] {
  if (count <= 0) return [];
  if (pool.length === 0) return [];
  if (pool.length <= count) return pool.slice(0, count);

  const picked: Date[] = [];
  const step = pool.length / count;
  for (let i = 0; i < count; i += 1) {
    const index = Math.min(pool.length - 1, Math.floor(i * step + step / 2));
    picked.push(pool[index]!);
  }

  return picked.sort((a, b) => a.getTime() - b.getTime());
}

function payrollDatesInRange(count: number, range: DateRange): Date[] {
  if (count <= 0) return [];

  const payrollDays = collectPayrollDays(range);
  if (payrollDays.length > 0) {
    return pickEvenlySpacedDates(payrollDays, count).map((date) =>
      clampToRange(withRandomTime(date, 9, 11), range)
    );
  }

  return spreadDatesAcrossRange(count, range, {
    hourMin: 9,
    hourMax: 11,
    preferWeekdays: true,
  });
}

function spreadDatesAcrossRange(
  count: number,
  range: DateRange,
  options: {
    hourMin?: number;
    hourMax?: number;
    preferWeekdays?: boolean;
    avoidDateKeys?: Set<string>;
  } = {}
): Date[] {
  if (count <= 0) return [];

  const hourMin = options.hourMin ?? 8;
  const hourMax = options.hourMax ?? 20;
  const startMs = range.start.getTime();
  const endMs = range.end.getTime();
  const span = Math.max(endMs - startMs, 60 * 60 * 1000);
  const idealGap = span / count;
  const used = new Set(options.avoidDateKeys ?? []);
  const results: Date[] = [];

  for (let i = 0; i < count; i += 1) {
    let placed = false;

    for (let attempt = 0; attempt < 48; attempt += 1) {
      const anchor = startMs + idealGap * (i + 0.5);
      const jitter = (Math.random() - 0.5) * idealGap * 0.9;
      let candidate = new Date(anchor + jitter);

      if (options.preferWeekdays) {
        const day = candidate.getDay();
        if (day === 0) candidate.setDate(candidate.getDate() + 1);
        if (day === 6) candidate.setDate(candidate.getDate() - 1);
      }

      candidate = clampToRange(candidate, range);
      const key = dateKey(candidate);
      const allowReuse = attempt > 24;

      if (!used.has(key) || allowReuse) {
        const dated = clampToRange(withRandomTime(candidate, hourMin, hourMax), range);
        results.push(dated);
        used.add(dateKey(dated));
        placed = true;
        break;
      }
    }

    if (!placed) {
      const fallback = clampToRange(
        withRandomTime(new Date(startMs + idealGap * i), hourMin, hourMax),
        range
      );
      results.push(fallback);
    }
  }

  return results.sort((a, b) => a.getTime() - b.getTime());
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
  company: string,
  range: DateRange
): PlannedTransaction[] {
  if (creditCount <= 0) return [];

  const { payroll, other } = splitCreditCounts(creditCount);
  const planned: PlannedTransaction[] = [];
  const payrollDatesList = payrollDatesInRange(payroll, range);
  const usedDays = new Set(payrollDatesList.map(dateKey));

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

  const otherDates = spreadDatesAcrossRange(other, range, {
    hourMin: 9,
    hourMax: 17,
    preferWeekdays: true,
    avoidDateKeys: usedDays,
  });

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
      postedAt: otherDates[i] ?? spreadDatesAcrossRange(1, range)[0]!,
    });
  }

  return planned.sort((a, b) => a.postedAt.getTime() - b.postedAt.getTime());
}

function planDebits(
  debitCount: number,
  state: string,
  range: DateRange
): PlannedTransaction[] {
  const dates = spreadDatesAcrossRange(debitCount, range, {
    hourMin: 7,
    hourMax: 21,
    preferWeekdays: false,
  });

  return dates.map((postedAt) => {
    const description = buildDebitDescription(state);
    return {
      direction: "debit" as const,
      amount: debitAmountForCategory(description),
      type: "withdrawal" as const,
      description: `POS Debit — ${description}`,
      postedAt,
    };
  });
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
  const range = resolveActivityPeriod(input.periodStart, input.periodEnd);

  if (creditCount === 0 && debitCount === 0) {
    throw new Error("Set at least one debit or credit to generate.");
  }

  const startingBalance = await getAccountBalance(admin, input.accountId);
  const credits = planCredits(creditCount, company, range);
  const debits = planDebits(debitCount, state, range);

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
    periodStart: formatCalendarDate(range.start),
    periodEnd: formatCalendarDate(range.end),
  };
}
