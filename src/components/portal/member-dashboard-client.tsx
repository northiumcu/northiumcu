"use client";

import { useEffect, useState } from "react";
import { MemberDashboard } from "@/components/portal/member-dashboard";
import type { Account, Transaction } from "@/types/database";

export function MemberDashboardClient() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    void Promise.all([
      fetch("/api/member/accounts").then((r) => r.json()),
      fetch("/api/member/transactions").then((r) => r.json()),
    ]).then(([accountData, txData]) => {
      setAccounts(accountData.accounts ?? []);
      setTransactions(txData.transactions ?? []);
    });
  }, []);

  return (
    <MemberDashboard accounts={accounts} transactions={transactions} />
  );
}
