import { Badge } from "@/components/ui/badge";
import type { Account } from "@/types/database";
import { accountTypeTheme } from "@/lib/portal/theme";
import { formatCurrency } from "@/lib/format/currency";
import { cn } from "@/lib/utils";

interface AccountCardProps {
  account: Pick<Account, "type" | "account_number" | "balance" | "status">;
}

export function AccountCard({ account }: AccountCardProps) {
  const theme = accountTypeTheme[account.type];
  const Icon = theme.icon;
  const formatted = formatCurrency(account.balance);

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl",
        theme.gradient
      )}
    >
      <div className="pointer-events-none absolute -right-6 -top-8 size-28 rounded-full bg-white/15 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className={cn("text-sm font-medium", theme.accent)}>{theme.label}</p>
          <p className="mt-3 font-heading text-3xl font-bold tracking-tight">{formatted}</p>
          <p className="mt-2 text-xs text-white/75">
            Account ••••{account.account_number.slice(-4)}
          </p>
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
