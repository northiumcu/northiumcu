"use client";

import { useCallback, useEffect, useState } from "react";
import { TransactionTable } from "@/components/portal/transaction-table";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types/database";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

interface PaginatedTransactionListProps {
  accountId?: string;
  title?: string;
  description?: string;
  className?: string;
}

export function PaginatedTransactionList({
  accountId,
  title = "Transactions",
  description,
  className,
}: PaginatedTransactionListProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(targetPage),
      limit: String(PAGE_SIZE),
    });
    if (accountId) params.set("accountId", accountId);

    const response = await fetch(`/api/member/transactions?${params.toString()}`);
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to load transactions.");
      setTransactions([]);
      return;
    }

    setTransactions(data.transactions ?? []);
    setPagination(
      data.pagination ?? {
        page: targetPage,
        limit: PAGE_SIZE,
        total: (data.transactions ?? []).length,
        totalPages: 1,
      }
    );
  }, [accountId]);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  const pages = buildPageNumbers(pagination.page, pagination.totalPages);

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h2 className="font-heading text-lg font-semibold text-northium-primary">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-northium-muted">{description}</p>
        )}
        {!loading && pagination.total > 0 && (
          <p className="mt-1 text-xs text-northium-muted">
            Showing {(pagination.page - 1) * pagination.limit + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total.toLocaleString()} transactions
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-northium-muted">Loading transactions...</p>
      ) : (
        <TransactionTable transactions={transactions} />
      )}

      {pagination.totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || pagination.page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            className="rounded-lg"
          >
            Previous
          </Button>

          {pages.map((item, index) =>
            item === "…" ? (
              <span key={`gap-${index}`} className="px-1 text-sm text-northium-muted">
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === pagination.page ? "default" : "outline"}
                size="sm"
                disabled={loading}
                onClick={() => setPage(item)}
                className={cn(
                  "min-w-9 rounded-lg",
                  item === pagination.page &&
                    "bg-northium-primary text-white hover:bg-northium-secondary"
                )}
              >
                {item}
              </Button>
            )
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || pagination.page >= pagination.totalPages}
            onClick={() =>
              setPage((current) => Math.min(pagination.totalPages, current + 1))
            }
            className="rounded-lg"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function buildPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages: (number | "…")[] = [1];

  if (current > 3) pages.push("…");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (current < total - 2) pages.push("…");
  pages.push(total);

  return pages;
}
