"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LoanApp {
  id: string;
  loan_type: string;
  purpose: string | null;
  requested_amount: number | null;
  term_months: number;
  status: string;
  member: { first_name: string; last_name: string; email: string } | null;
}

export default function AdminLoansPage() {
  const [applications, setApplications] = useState<LoanApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/loans");
    const data = await response.json();
    setLoading(false);
    if (response.ok) setApplications(data.applications ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, decision: string) {
    setMessage(null);
    const response = await fetch(`/api/admin/loans/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note: notes[id] || undefined }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Action failed.");
      return;
    }
    setMessage(`Loan ${decision}. Member notified.`);
    void load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Loans</h1>
        <p className="mt-1 text-sm text-white/55">
          Review personal, auto, and mortgage applications.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-northium-gold/30 bg-northium-gold/10 px-4 py-3 text-sm text-northium-gold">
          {message}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f2233]">
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/60">Member</TableHead>
              <TableHead className="text-white/60">Type</TableHead>
              <TableHead className="text-white/60">Purpose</TableHead>
              <TableHead className="text-white/60">Amount</TableHead>
              <TableHead className="text-white/60">Term</TableHead>
              <TableHead className="text-right text-white/60">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-white/50">
                  Loading…
                </TableCell>
              </TableRow>
            ) : applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-white/50">
                  No pending loan applications.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => (
                <TableRow key={app.id} className="border-white/10 text-white/85">
                  <TableCell>
                    {app.member
                      ? `${app.member.first_name} ${app.member.last_name}`
                      : "—"}
                  </TableCell>
                  <TableCell className="capitalize">{app.loan_type}</TableCell>
                  <TableCell className="max-w-[140px] truncate text-sm">
                    {app.purpose ?? "—"}
                  </TableCell>
                  <TableCell>
                    ${Number(app.requested_amount ?? 0).toLocaleString()}
                  </TableCell>
                  <TableCell>{app.term_months} mo</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-2">
                      <Input
                        value={notes[app.id] ?? ""}
                        onChange={(e) =>
                          setNotes((n) => ({ ...n, [app.id]: e.target.value }))
                        }
                        placeholder="Note to member"
                        className="h-8 w-40 rounded-lg border-white/15 bg-[#06121c] text-xs text-white"
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="bg-northium-gold text-[#06121c]"
                          onClick={() => void decide(app.id, "approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-white/20 text-white"
                          onClick={() => void decide(app.id, "delayed")}
                        >
                          Delay
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-400/40 text-red-300"
                          onClick={() => void decide(app.id, "denied")}
                        >
                          Deny
                        </Button>
                      </div>
                    </div>
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
