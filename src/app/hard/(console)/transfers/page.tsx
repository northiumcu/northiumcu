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

interface TransferRow {
  id: string;
  type: string;
  amount: number;
  status: string;
  beneficiary_name: string | null;
  zelle_contact: string | null;
  created_at: string;
  member: { first_name: string; last_name: string; email: string } | null;
}

export default function AdminTransfersPage() {
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/transfers");
    const data = await response.json();
    setLoading(false);
    if (response.ok) setTransfers(data.transfers ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function decide(id: string, decision: string) {
    setMessage(null);
    const response = await fetch(`/api/admin/transfers/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note: note[id] || undefined }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Action failed.");
      return;
    }
    setMessage(`Transfer ${decision}. Member notified.`);
    void load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">
          Transfer Queue
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Approve, delay, deny, or hold member transfers (especially when DELAY
          TRANSACTION is enabled).
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
              <TableHead className="text-white/60">Amount</TableHead>
              <TableHead className="text-white/60">Receiver</TableHead>
              <TableHead className="text-white/60">Note to member</TableHead>
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
            ) : transfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-white/50">
                  No pending transfers.
                </TableCell>
              </TableRow>
            ) : (
              transfers.map((t) => (
                <TableRow key={t.id} className="border-white/10 text-white/85">
                  <TableCell>
                    {t.member
                      ? `${t.member.first_name} ${t.member.last_name}`
                      : "—"}
                  </TableCell>
                  <TableCell className="capitalize">{t.type.replace(/_/g, " ")}</TableCell>
                  <TableCell>${Number(t.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    {t.beneficiary_name ?? t.zelle_contact ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={note[t.id] ?? ""}
                      onChange={(e) =>
                        setNote((n) => ({ ...n, [t.id]: e.target.value }))
                      }
                      placeholder="Optional message"
                      className="h-8 rounded-lg border-white/15 bg-[#06121c] text-xs text-white"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button
                        size="sm"
                        className="bg-northium-gold text-[#06121c] hover:bg-northium-gold/90"
                        onClick={() => void decide(t.id, "approved")}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/5"
                        onClick={() => void decide(t.id, "delayed")}
                      >
                        Delay
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/5"
                        onClick={() => void decide(t.id, "pending")}
                      >
                        Pending
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-400/40 text-red-300 hover:bg-red-500/10"
                        onClick={() => void decide(t.id, "denied")}
                      >
                        Deny
                      </Button>
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
