import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";
import {
  buildAdminReportSummaries,
  fetchAdminOperationalStats,
} from "@/lib/admin/operational-stats";
import { formatCurrency } from "@/lib/format/currency";

export async function GET() {
  try {
    const auth = await requireStaff();
    if ("error" in auth) return auth.error;

    const stats = await fetchAdminOperationalStats(auth.admin);
    const reports = buildAdminReportSummaries(stats).map((report) => {
      if (report.id === "financial") {
        return {
          ...report,
          description: `${stats.activeAccounts.toLocaleString()} active accounts · ${stats.totalMembers.toLocaleString()} active members · ${formatCurrency(stats.outstandingLoans)} in outstanding loans`,
        };
      }
      if (report.id === "loans") {
        return {
          ...report,
          description: `${stats.delinquentLoans.toLocaleString()} delinquent loan(s) · ${formatCurrency(stats.outstandingLoans)} outstanding portfolio balance`,
        };
      }
      if (report.id === "transactions") {
        return {
          ...report,
          description: `${stats.transactionCount30d.toLocaleString()} posted transaction(s) · ${formatCurrency(stats.transactionVolume30d)} total volume in the last 30 days`,
        };
      }
      return report;
    });

    return NextResponse.json({ reports, generatedAt: stats.generatedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
