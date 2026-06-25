import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Transaction } from "@/types/database";
import { formatCurrency } from "@/lib/format/currency";
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
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-northium-border/80 bg-white/70 p-8 text-center text-sm text-northium-muted backdrop-blur-sm">
        No transactions to display yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-northium-border/60 bg-gradient-to-r from-northium-surface to-emerald-50/50 hover:bg-gradient-to-r hover:from-northium-surface hover:to-emerald-50/50">
            <TableHead className="font-semibold text-northium-primary">Date</TableHead>
            <TableHead className="font-semibold text-northium-primary">Description</TableHead>
            <TableHead className="font-semibold text-northium-primary">Reference</TableHead>
            <TableHead className="text-right font-semibold text-northium-primary">
              Amount
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const isCredit = CREDIT_TYPES.includes(tx.type);
            return (
              <TableRow
                key={tx.id}
                className="border-northium-border/50 transition-colors hover:bg-sky-50/50"
              >
                <TableCell className="text-northium-muted">
                  {dateFormatter.format(
                    new Date(tx.posted_at ?? tx.created_at)
                  )}
                </TableCell>
                <TableCell className="font-medium text-northium-text">
                  {tx.description}
                </TableCell>
                <TableCell className="text-northium-muted">
                  {tx.reference ?? "—"}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold",
                    isCredit ? "text-emerald-600" : "text-northium-primary"
                  )}
                >
                  {isCredit ? "+" : "-"}
                  {formatCurrency(Math.abs(tx.amount))}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
