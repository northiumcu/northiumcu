import { AlertsPanel } from "@/components/portal/alerts-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const auditLogs = [
  {
    id: "1",
    action: "admin.member.suspend",
    actor: "J. Mitchell",
    ip: "10.0.1.42",
    time: "2026-03-24 09:14:22",
  },
  {
    id: "2",
    action: "admin.loan.approve",
    actor: "S. Chen",
    ip: "10.0.1.18",
    time: "2026-03-24 08:42:10",
  },
  {
    id: "3",
    action: "admin.account.freeze",
    actor: "System",
    ip: "—",
    time: "2026-03-24 07:30:05",
  },
  {
    id: "4",
    action: "admin.settings.update",
    actor: "J. Mitchell",
    ip: "10.0.1.42",
    time: "2026-03-23 16:30:44",
  },
  {
    id: "5",
    action: "admin.card.cancel",
    actor: "S. Chen",
    ip: "10.0.1.18",
    time: "2026-03-23 14:15:33",
  },
];

export default function AdminSecurityPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-northium-primary">
          Security & Compliance
        </h1>
        <p className="mt-1 text-northium-muted">
          Audit logs, risk monitoring, and security configuration.
        </p>
      </div>

      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold text-northium-primary">
          Risk Alerts
        </h2>
        <AlertsPanel />
      </div>

      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold text-northium-primary">
          Audit Log
        </h2>
        <div className="overflow-hidden rounded-2xl border border-northium-border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-northium-surface">
                <TableHead>Action</TableHead>
                <TableHead>Administrator</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">
                    {log.action}
                  </TableCell>
                  <TableCell>{log.actor}</TableCell>
                  <TableCell className="font-mono text-sm text-northium-muted">
                    {log.ip}
                  </TableCell>
                  <TableCell className="text-northium-muted">
                    {log.time}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-northium-success/10 text-northium-success">
                      Logged
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
