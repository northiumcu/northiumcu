import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  assertLoanTransferAllowed,
  canTransferFromLoanTo,
  isLoanAccountType,
  loanAccountAllowsTransferType,
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

  it("restricts loan accounts to internal transfers only", () => {
    assert.equal(loanAccountAllowsTransferType("internal"), true);
    assert.equal(loanAccountAllowsTransferType("local_wire"), false);
    assert.equal(loanAccountAllowsTransferType("zelle"), false);

    assert.doesNotThrow(() =>
      assertLoanTransferAllowed("loan", "internal")
    );
    assert.throws(
      () => assertLoanTransferAllowed("loan", "international_wire"),
      /internal transfers/
    );
    assert.doesNotThrow(() =>
      assertLoanTransferAllowed("checking", "local_wire")
    );
  });
});
