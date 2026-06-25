import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  allowedInternalDestinationTypes,
  isValidInternalTransferPair,
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
  it("pairs checking with savings only", () => {
    assert.deepEqual(allowedInternalDestinationTypes("checking"), ["savings"]);
    assert.deepEqual(allowedInternalDestinationTypes("savings"), ["checking"]);
    assert.equal(isValidInternalTransferPair("checking", "savings"), true);
    assert.equal(isValidInternalTransferPair("checking", "loan"), false);
    assert.equal(isValidInternalTransferPair("checking", "checking"), false);
  });

  it("lists only savings as the destination from checking", () => {
    const destinations = listInternalDestinationAccounts(accounts, "checking-1");
    assert.deepEqual(
      destinations.map((account) => account.id),
      ["savings-1"]
    );
  });

  it("lists only checking as the destination from savings", () => {
    const destinations = listInternalDestinationAccounts(accounts, "savings-1");
    assert.deepEqual(
      destinations.map((account) => account.id),
      ["checking-1"]
    );
  });

  it("lists only checking and savings when source is a loan account", () => {
    const destinations = listInternalDestinationAccounts(accounts, "loan-1");
    assert.deepEqual(
      destinations.map((account) => account.id),
      ["checking-1", "savings-1"]
    );
  });

  it("never lists loan accounts as destinations", () => {
    for (const account of accounts) {
      const destinations = listInternalDestinationAccounts(accounts, account.id);
      assert.equal(
        destinations.some((destination) => destination.type === "loan"),
        false
      );
    }
  });

  it("picks the first valid destination account", () => {
    assert.equal(
      pickDefaultInternalDestination(accounts, "checking-1"),
      "savings-1"
    );
    assert.equal(
      pickDefaultInternalDestination(accounts, "savings-1"),
      "checking-1"
    );
    assert.equal(
      pickDefaultInternalDestination(accounts, "loan-1"),
      "checking-1"
    );
  });
});
