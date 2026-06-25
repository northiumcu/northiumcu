import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  listInternalDestinationAccounts,
  pickDefaultInternalDestination,
} from "../../src/lib/banking/internal-transfer-helpers.ts";

const accounts = [
  {
    id: "checking-1",
    type: "checking",
    account_number: "100000000001",
    status: "active",
  },
  {
    id: "savings-1",
    type: "savings",
    account_number: "100000000002",
    status: "active",
  },
  {
    id: "loan-1",
    type: "loan",
    account_number: "100000000003",
    status: "active",
  },
];

describe("internal transfer helpers", () => {
  it("lists checking and savings as destinations from checking", () => {
    const destinations = listInternalDestinationAccounts(accounts, "checking-1");
    assert.deepEqual(
      destinations.map((account) => account.id),
      ["savings-1"]
    );
  });

  it("lists only checking and savings when source is a loan account", () => {
    const destinations = listInternalDestinationAccounts(accounts, "loan-1");
    assert.deepEqual(
      destinations.map((account) => account.id),
      ["checking-1", "savings-1"]
    );
  });

  it("picks the first valid destination account", () => {
    assert.equal(
      pickDefaultInternalDestination(accounts, "checking-1"),
      "savings-1"
    );
  });
});
