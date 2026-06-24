import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Transaction } from "@/types/database";
import { cn } from "@/lib/utils";

const CREDIT_TYPES: Transaction["type"][] = [
  "deposit",
  "interest",
  "refund",
  "reversal",
];

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-northium-border bg-white p-8 text-center text-sm text-northium-muted">
        No transactions to display.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-northium-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-northium-surface hover:bg-northium-surface">
            <TableHead className="font-semibold">Date</TableHead>
            <TableHead className="font-semibold">Description</TableHead>
            <TableHead className="font-semibold">Reference</TableHead>
            <TableHead className="text-right font-semibold">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const isCredit = CREDIT_TYPES.includes(tx.type);
            return (
              <TableRow key={tx.id}>
                <TableCell className="text-northium-muted">
                  {dateFormatter.format(new Date(tx.created_at))}
                </TableCell>
                <TableCell className="font-medium">{tx.description}</TableCell>
                <TableCell className="text-northium-muted">
                  {tx.reference ?? "—"}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold",
                    isCredit ? "text-northium-success" : "text-northium-text"
                  )}
                >
                  {isCredit ? "+" : "-"}
                  {formatter.format(Math.abs(tx.amount))}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
