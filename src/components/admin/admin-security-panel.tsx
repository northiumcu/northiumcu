"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { adminButtonNeutral } from "@/components/admin/admin-button-styles";
import { Button } from "@/components/ui/button";

type AuditLogRow = {
  id: string;
  action: string;
  actor_role: string;
  resource_type: string;
  ip_address: string | null;
  created_at: string;
  reason_note: string | null;
  channel: string;
  actor: {
    first_name: string;
    last_name: string;
    email: string;
    staff_role: string;
  } | null;
};

function formatActor(log: AuditLogRow) {
  if (log.actor) {
    return `${log.actor.first_name} ${log.actor.last_name}`.trim();
  }
  if (log.actor_role === "system") return "System";
  return log.actor_role;
}

export function AdminSecurityPanel() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/audit-logs?limit=100");
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "Could not load audit logs.");
      return;
    }
    setLogs(data.logs ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-white/55">
          Live append-only audit trail from administrator and member security
          events.
        </p>
        <Button
          variant="outline"
          onClick={() => void load()}
          className={adminButtonNeutral}
        >
          Refresh
        </Button>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f2233]">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/60">Action</TableHead>
              <TableHead className="text-white/60">Actor</TableHead>
              <TableHead className="text-white/60">Resource</TableHead>
              <TableHead className="text-white/60">IP Address</TableHead>
              <TableHead className="text-white/60">Timestamp</TableHead>
              <TableHead className="text-white/60">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-white/50"
                >
                  Loading audit log…
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-white/50"
                >
                  No audit entries yet. Administrator actions will appear here as
                  they occur.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="border-white/10 text-white/85">
                  <TableCell className="font-mono text-sm">{log.action}</TableCell>
                  <TableCell>{formatActor(log)}</TableCell>
                  <TableCell className="text-sm text-white/55">
                    {log.resource_type}
                    {log.reason_note ? ` — ${log.reason_note}` : ""}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-white/55">
                    {log.ip_address ?? "—"}
                  </TableCell>
                  <TableCell className="text-white/55">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-northium-gold/15 text-northium-gold">
                      Logged
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
