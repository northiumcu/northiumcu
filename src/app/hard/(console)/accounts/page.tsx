"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format/currency";

interface AccountRow {
  id: string;
  account_number: string;
  type: string;
  balance: number;
  available_balance: number;
  status: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
}

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/members");
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return;

    const rows: AccountRow[] = [];
    for (const member of data.members ?? []) {
      for (const account of member.accounts ?? []) {
        rows.push({
          ...account,
          profiles: {
            first_name: member.first_name,
            last_name: member.last_name,
            email: member.email,
          },
        });
      }
    }
    setAccounts(rows);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Accounts</h1>
          <p className="mt-1 text-sm text-white/55">
            Institution-wide account portfolio.
          </p>
        </div>
        <Button
          className="bg-northium-gold text-[#06121c] hover:bg-northium-gold/90"
          nativeButton={false}
          render={<Link href="/hard/member-controls" />}
        >
          Open Member Controls
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f2233]">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/60">Member</TableHead>
              <TableHead className="text-white/60">Account #</TableHead>
              <TableHead className="text-white/60">Type</TableHead>
              <TableHead className="text-white/60">Balance</TableHead>
              <TableHead className="text-white/60">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-white/50">
                  Loading accounts...
                </TableCell>
              </TableRow>
            ) : accounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-white/50">
                  No accounts on file.
                </TableCell>
              </TableRow>
            ) : (
              accounts.map((account) => (
                <TableRow key={account.id} className="border-white/10 text-white/85">
                  <TableCell>
                    {account.profiles
                      ? `${account.profiles.first_name} ${account.profiles.last_name}`
                      : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {account.account_number}
                  </TableCell>
                  <TableCell className="capitalize">{account.type}</TableCell>
                  <TableCell>{formatCurrency(account.balance)}</TableCell>
                  <TableCell className="capitalize">{account.status}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
