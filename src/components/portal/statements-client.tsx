"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Account {
  id: string;
  account_number: string;
  type: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  posted_at: string | null;
  created_at: string;
}

export function StatementsClient() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void fetch("/api/member/accounts")
      .then((r) => r.json())
      .then((data) => {
        const active = data.accounts ?? [];
        setAccounts(active);
        if (active[0]) {
          setAccountId(active[0].id);
          const opened = new Date(active[0].opened_at ?? "2020-01-01");
          setFrom(opened.toISOString().slice(0, 10));
        }
        setTo(new Date().toISOString().slice(0, 10));
      });
  }, []);

  useEffect(() => {
    if (!accountId || !from || !to) return;
    setLoading(true);
    void fetch(
      `/api/member/transactions?accountId=${accountId}&from=${from}&to=${to}`
    )
      .then((r) => r.json())
      .then((data) => {
        setTransactions(data.transactions ?? []);
        setLoading(false);
      });
  }, [accountId, from, to]);

  const creditTypes = new Set(["deposit", "interest", "refund", "adjustment"]);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-northium-border">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-northium-primary">
            Statement Period
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label>Account</Label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-xl border border-northium-border px-3 py-2 text-sm"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.type} ••••{a.account_number.slice(-4)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>From</Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="sm:col-span-4">
            <Button
              nativeButton={false}
              render={
                <a
                  href={`/api/member/statement?accountId=${accountId}&from=${from}&to=${to}`}
                  download
                />
              }
              className="bg-northium-primary hover:bg-northium-secondary"
            >
              Download PDF Statement
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-2xl border border-northium-border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-northium-surface">
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-sm text-northium-muted">
                  Loading transactions…
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-sm text-northium-muted">
                  No transactions in this period.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => {
                const isCredit = creditTypes.has(tx.type);
                return (
                  <TableRow key={tx.id}>
                    <TableCell className="text-northium-muted">
                      {new Date(tx.posted_at ?? tx.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell
                      className={`text-right font-medium ${isCredit ? "text-northium-success" : "text-northium-primary"}`}
                    >
                      {isCredit ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
