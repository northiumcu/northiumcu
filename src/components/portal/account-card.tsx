import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Account } from "@/types/database";
import { accountTypeTheme } from "@/lib/portal/theme";
import { formatCurrency } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

interface AccountCardProps {
  account: Pick<
    Account,
    "id" | "type" | "account_number" | "balance" | "status" | "product_slug"
  >;
  href?: string;
  showTransfer?: boolean;
}

export function AccountCard({
  account,
  href,
  showTransfer = true,
}: AccountCardProps) {
  const theme = accountTypeTheme[account.type];
  const Icon = theme.icon;
  const formatted = formatCurrency(account.balance);
  const transferHref = `/member/transfers?from=${account.id}`;
  const typeLabel =
    account.type === "loan" && account.product_slug
      ? account.product_slug.replace(/_loan$/, "").replace(/_/g, " ")
      : theme.label;
  const displayLabel =
    account.type === "loan"
      ? `${typeLabel.replace(/\b\w/g, (c) => c.toUpperCase())} Loan`
      : theme.label;

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg",
        theme.gradient
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-8 size-28 rounded-full bg-white/15 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-medium", theme.accent)}>{displayLabel}</p>
          <p className="mt-3 font-heading text-3xl font-bold tracking-tight">{formatted}</p>
          <p className="mt-2 text-xs text-white/75">
            Account ••••{account.account_number.slice(-4)}
          </p>

          {showTransfer && account.status === "active" && (
            <Button
              nativeButton={false}
              render={<Link href={transferHref} />}
              size="sm"
              className="mt-3 h-8 rounded-lg border border-white/25 bg-white/15 px-3 text-xs font-semibold text-white hover:bg-white/25"
            >
              <ArrowLeftRight className="mr-1.5 size-3.5" />
              Transfer
            </Button>
          )}

          {href && (
            <Link
              href={href}
              className="mt-3 inline-block text-xs font-medium text-white/85 underline-offset-2 hover:text-white hover:underline"
            >
              View transactions →
            </Link>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Icon className="size-5 text-white" />
          </span>
          <Badge className="border-white/20 bg-white/15 text-white hover:bg-white/15">
            {account.status}
          </Badge>
        </div>
      </div>
    </article>
  );
}
