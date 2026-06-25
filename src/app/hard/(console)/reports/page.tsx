import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const reports = [
  {
    title: "Monthly Financial Summary",
    description: "Assets, liabilities, and net worth as of March 2026",
    updated: "Mar 24, 2026",
  },
  {
    title: "Loan Portfolio Report",
    description: "Outstanding balances, delinquency rates, and originations",
    updated: "Mar 24, 2026",
  },
  {
    title: "Member Growth Report",
    description: "New memberships, closures, and retention metrics",
    updated: "Mar 23, 2026",
  },
  {
    title: "Transaction Volume",
    description: "Daily transaction counts and aggregate volumes",
    updated: "Mar 24, 2026",
  },
  {
    title: "Fraud & Risk Report",
    description: "Flagged transactions, blocked accounts, and investigations",
    updated: "Mar 24, 2026",
  },
  {
    title: "Regulatory Compliance",
    description: "Reporting requirements and audit readiness",
    updated: "Mar 1, 2026",
  },
];

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Reports</h1>
        <p className="mt-1 text-sm text-white/55">
          Institutional reporting and regulatory compliance documents.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {reports.map((report) => (
          <Card
            key={report.title}
            className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none"
          >
            <CardHeader>
              <CardTitle className="text-base font-semibold text-white">
                {report.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-white/55">{report.description}</p>
              <p className="mt-3 text-xs text-white/40">
                Last updated: {report.updated}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
