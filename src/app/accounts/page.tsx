import { PublicLayout } from "@/components/layout/public-layout";
import { PageHeader } from "@/components/marketing/page-header";
import { ContentSection } from "@/components/marketing/content-section";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const accountTypes = [
  {
    name: "Essential Checking",
    type: "Checking",
    minBalance: "$0",
    monthlyFee: "$0",
    features: "Free debit card, mobile deposit, bill pay",
  },
  {
    name: "Premium Checking",
    type: "Checking",
    minBalance: "$2,500",
    monthlyFee: "$0",
    features: "ATM fee rebates, overdraft protection, priority support",
  },
  {
    name: "High-Yield Savings",
    type: "Savings",
    minBalance: "$100",
    monthlyFee: "$0",
    features: "Competitive rate, no withdrawal limits",
  },
  {
    name: "Youth Savings",
    type: "Youth",
    minBalance: "$25",
    monthlyFee: "$0",
    features: "For members under 18, parental controls",
  },
  {
    name: "Business Checking",
    type: "Business",
    minBalance: "$1,000",
    monthlyFee: "$0",
    features: "Merchant services, payroll integration",
  },
  {
    name: "IRA Savings",
    type: "Retirement",
    minBalance: "$500",
    monthlyFee: "$0",
    features: "Traditional and Roth options available",
  },
] as const;

export default function AccountsPage() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Accounts"
        title="Accounts For Every Stage Of Life"
        description="From everyday checking to long-term retirement savings, Northium offers accounts designed for stability and growth."
        visual="accounts"
      />
      <ContentSection>
        <div className="overflow-x-auto rounded-2xl border border-northium-border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-northium-surface">
                <TableHead className="font-semibold">Account</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Min. Balance</TableHead>
                <TableHead className="font-semibold">Monthly Fee</TableHead>
                <TableHead className="font-semibold">Features</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountTypes.map((account) => (
                <TableRow key={account.name}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>{account.type}</TableCell>
                  <TableCell>{account.minBalance}</TableCell>
                  <TableCell>{account.monthlyFee}</TableCell>
                  <TableCell className="text-northium-muted">
                    {account.features}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-6 text-sm text-northium-muted">
          Current rates and annual percentage yields (APY) are published when
          available. Contact member services for the latest product details.
        </p>
      </ContentSection>
    </PublicLayout>
  );
}
