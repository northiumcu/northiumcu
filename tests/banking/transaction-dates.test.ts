import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveActivityPeriod,
  snapPayrollToWeekday,
} from "../../src/lib/banking/transaction-generation-dates.ts";

describe("transaction generation dates", () => {
  it("honors the admin-selected activity period", () => {
    const range = resolveActivityPeriod("2025-01-01", "2025-03-31");
    assert.equal(range.start.getFullYear(), 2025);
    assert.equal(range.start.getMonth(), 0);
    assert.equal(range.start.getDate(), 1);
    assert.equal(range.end.getFullYear(), 2025);
    assert.equal(range.end.getMonth(), 2);
    assert.equal(range.end.getDate(), 31);
  });

  it("moves weekend payroll to the prior Friday", () => {
    const saturday = new Date(2025, 5, 14, 10, 0, 0, 0);
    const sunday = new Date(2025, 5, 15, 10, 0, 0, 0);
    const friday = new Date(2025, 5, 13, 10, 0, 0, 0);

    assert.equal(snapPayrollToWeekday(saturday).getDay(), 5);
    assert.equal(snapPayrollToWeekday(saturday).getDate(), 13);
    assert.equal(snapPayrollToWeekday(sunday).getDay(), 5);
    assert.equal(snapPayrollToWeekday(sunday).getDate(), 13);
    assert.equal(snapPayrollToWeekday(friday).getDate(), 13);
  });
});
