export type DateRange = {
  start: Date;
  end: Date;
};

export function formatCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function defaultPeriodEnd(): string {
  return formatCalendarDate(new Date());
}

export function defaultPeriodStart(): string {
  const date = new Date();
  date.setDate(date.getDate() - 60);
  return formatCalendarDate(date);
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

  return { start, end };
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** Payroll never posts on Saturday or Sunday — move to the prior Friday. */
export function snapPayrollToWeekday(date: Date): Date {
  const next = new Date(date);
  const day = next.getDay();
  if (day === 6) {
    next.setDate(next.getDate() - 1);
  } else if (day === 0) {
    next.setDate(next.getDate() - 2);
  }
  return next;
}
