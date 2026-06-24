import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Account } from "@/types/database";

const accountLabels: Record<Account["type"], string> = {
  checking: "Checking",
  savings: "Savings",
  certificate: "Certificate",
  youth: "Youth Savings",
  business: "Business",
  retirement: "Retirement",
};

interface AccountCardProps {
  account: Pick<Account, "type" | "account_number" | "balance" | "status">;
}

export function AccountCard({ account }: AccountCardProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(account.balance);

  return (
    <Card className="rounded-2xl border-northium-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-northium-muted">
          {accountLabels[account.type]}
        </CardTitle>
        <Badge
          variant={account.status === "active" ? "default" : "secondary"}
          className={
            account.status === "active"
              ? "bg-northium-success/10 text-northium-success"
              : ""
          }
        >
          {account.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-2xl font-bold text-northium-primary">
          {formatted}
        </p>
        <p className="mt-1 text-xs text-northium-muted">
          ••••{account.account_number.slice(-4)}
        </p>
      </CardContent>
    </Card>
  );
}
