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
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">
          Security & Compliance
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Audit logs, risk monitoring, and security configuration.
        </p>
      </div>

      <div>
        <h2 className="mb-4 font-heading text-lg font-semibold text-white">
          Audit Log
        </h2>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f2233]">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Action</TableHead>
                <TableHead className="text-white/60">Administrator</TableHead>
                <TableHead className="text-white/60">IP Address</TableHead>
                <TableHead className="text-white/60">Timestamp</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log.id} className="border-white/10 text-white/85">
                  <TableCell className="font-mono text-sm">
                    {log.action}
                  </TableCell>
                  <TableCell>{log.actor}</TableCell>
                  <TableCell className="font-mono text-sm text-white/55">
                    {log.ip}
                  </TableCell>
                  <TableCell className="text-white/55">{log.time}</TableCell>
                  <TableCell>
                    <Badge className="bg-northium-gold/15 text-northium-gold">
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
