import type { SupabaseClient } from "@supabase/supabase-js";

export type AdminOperationalStats = {
  totalMembers: number;
  activeAccounts: number;
  outstandingLoans: number;
  pendingApprovals: number;
  pendingMembershipApps: number;
  pendingTransfers: number;
  pendingCardApps: number;
  pendingLoanApps: number;
  transactionCount30d: number;
  transactionVolume30d: number;
  newMembers30d: number;
  delinquentLoans: number;
  generatedAt: string;
};

export type AdminReportSummary = {
  id: string;
  title: string;
  description: string;
  updatedAt: string | null;
};

function daysAgoIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export async function fetchAdminOperationalStats(
  admin: SupabaseClient
): Promise<AdminOperationalStats> {
  const since30d = daysAgoIso(30);

  const [
    membersRes,
    accountsRes,
    loansRes,
    appsRes,
    transfersRes,
    cardsRes,
    loanAppsRes,
    txRes,
    newMembersRes,
    delinquentRes,
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("staff_role", "member")
      .eq("member_status", "active"),
    admin
      .from("accounts")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    admin
      .from("loans")
      .select("outstanding_balance")
      .in("status", ["funded", "active", "delinquent"]),
    admin
      .from("membership_applications")
      .select("id", { count: "exact", head: true })
      .in("status", ["submitted", "under_review"]),
    admin
      .from("transfers")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_approval"),
    admin
      .from("cards")
      .select("id", { count: "exact", head: true })
      .eq("status", "ordered"),
    admin
      .from("loans")
      .select("id", { count: "exact", head: true })
      .in("status", ["application", "underwriting"]),
    admin
      .from("transactions")
      .select("amount, created_at")
      .gte("created_at", since30d),
    admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("staff_role", "member")
      .gte("created_at", since30d),
    admin
      .from("loans")
      .select("id", { count: "exact", head: true })
      .eq("status", "delinquent"),
  ]);

  const outstandingLoans = (loansRes.data ?? []).reduce(
    (sum, loan) => sum + Number(loan.outstanding_balance ?? 0),
    0
  );
  const transactionVolume30d = (txRes.data ?? []).reduce(
    (sum, tx) => sum + Number(tx.amount ?? 0),
    0
  );

  const pendingMembershipApps = appsRes.count ?? 0;
  const pendingTransfers = transfersRes.count ?? 0;
  const pendingCardApps = cardsRes.count ?? 0;
  const pendingLoanApps = loanAppsRes.count ?? 0;

  return {
    totalMembers: membersRes.count ?? 0,
    activeAccounts: accountsRes.count ?? 0,
    outstandingLoans,
    pendingApprovals:
      pendingMembershipApps +
      pendingTransfers +
      pendingCardApps +
      pendingLoanApps,
    pendingMembershipApps,
    pendingTransfers,
    pendingCardApps,
    pendingLoanApps,
    transactionCount30d: txRes.data?.length ?? 0,
    transactionVolume30d,
    newMembers30d: newMembersRes.count ?? 0,
    delinquentLoans: delinquentRes.count ?? 0,
    generatedAt: new Date().toISOString(),
  };
}

export function buildAdminReportSummaries(
  stats: AdminOperationalStats
): AdminReportSummary[] {
  const updated = stats.generatedAt;

  return [
    {
      id: "financial",
      title: "Monthly Financial Summary",
      description: `${stats.activeAccounts.toLocaleString()} active accounts · ${stats.totalMembers.toLocaleString()} active members · loan portfolio outstanding tracked live`,
      updatedAt: updated,
    },
    {
      id: "loans",
      title: "Loan Portfolio Report",
      description: `${stats.delinquentLoans.toLocaleString()} delinquent loan(s) · portfolio balance reflects all funded and active loans`,
      updatedAt: updated,
    },
    {
      id: "members",
      title: "Member Growth Report",
      description: `${stats.newMembers30d.toLocaleString()} new member(s) in the last 30 days · ${stats.pendingMembershipApps.toLocaleString()} membership application(s) awaiting review`,
      updatedAt: updated,
    },
    {
      id: "transactions",
      title: "Transaction Volume",
      description: `${stats.transactionCount30d.toLocaleString()} posted transaction(s) in the last 30 days`,
      updatedAt: updated,
    },
    {
      id: "risk",
      title: "Fraud & Risk Report",
      description: `${stats.pendingTransfers.toLocaleString()} transfer(s) pending approval · ${stats.pendingCardApps.toLocaleString()} card application(s) in queue`,
      updatedAt: updated,
    },
    {
      id: "compliance",
      title: "Operational Queue",
      description: `${stats.pendingApprovals.toLocaleString()} total item(s) requiring administrator action across memberships, transfers, cards, and loans`,
      updatedAt: updated,
    },
  ];
}
