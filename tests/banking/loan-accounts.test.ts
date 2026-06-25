import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canTransferFromLoanTo,
  isLoanAccountType,
} from "../../src/lib/banking/loan-accounts.ts";

describe("loan account transfers", () => {
  it("identifies loan accounts", () => {
    assert.equal(isLoanAccountType("loan"), true);
    assert.equal(isLoanAccountType("checking"), false);
  });

  it("allows loan disbursement only to checking or savings", () => {
    assert.equal(canTransferFromLoanTo("checking"), true);
    assert.equal(canTransferFromLoanTo("savings"), true);
    assert.equal(canTransferFromLoanTo("loan"), false);
    assert.equal(canTransferFromLoanTo("certificate"), false);
  });
});
