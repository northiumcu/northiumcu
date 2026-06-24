import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertsPanel } from "@/components/portal/alerts-panel";

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          "Total Members",
          "Active Accounts",
          "Outstanding Loans",
          "Pending Approvals",
        ].map((label) => (
          <Card key={label} className="rounded-2xl border-northium-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-northium-muted">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl font-bold text-northium-muted">
                —
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-4 font-heading text-lg font-semibold text-northium-primary">
            Recent Activity
          </h2>
          <div className="rounded-2xl border border-northium-border bg-white p-8 text-center text-sm text-northium-muted">
            Activity feed will populate from audit logs when operational
            services are connected.
          </div>
        </div>
        <div>
          <h2 className="mb-4 font-heading text-lg font-semibold text-northium-primary">
            Risk Alerts
          </h2>
          <AlertsPanel />
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold text-northium-primary">
          Audit Logs
        </h2>
        <div className="overflow-hidden rounded-2xl border border-northium-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-northium-surface">
                <TableHead>Action</TableHead>
                <TableHead>Administrator</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-sm text-northium-muted"
                >
                  No audit entries loaded. Connect audit service to view logs.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
