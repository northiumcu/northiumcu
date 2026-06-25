import { AdminReportsPanel } from "@/components/admin/admin-reports-panel";

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Reports</h1>
        <p className="mt-1 text-sm text-white/55">
          Live institutional metrics drawn from member, account, loan, and
          transaction data.
        </p>
      </div>
      <AdminReportsPanel />
    </div>
  );
}
