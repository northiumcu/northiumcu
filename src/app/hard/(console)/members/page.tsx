"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface KycRecord {
  id: string;
  status: string;
  ssn_last_four: string;
  id_document_type: string;
  id_document_last_four: string;
}

interface Application {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  status: string;
  submitted_at: string | null;
  requested_account_types: string[] | null;
  kyc_verifications: KycRecord[] | KycRecord | null;
}

export default function AdminMembersPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/applications");
    const data = await response.json();
    setLoading(false);
    if (response.ok) {
      setApplications(data.applications ?? []);
    } else {
      setMessage(data.error ?? "Failed to load applications.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(id: string, requireKyc: boolean) {
    setBusyId(id);
    setMessage(null);
    const response = await fetch(`/api/admin/applications/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requireKyc }),
    });
    const data = await response.json();
    setBusyId(null);
    if (!response.ok) {
      setMessage(data.error ?? "Approval failed.");
      return;
    }
    setMessage(
      `Approved${requireKyc ? " with KYC" : " without KYC"}. Account number: ${data.account?.account_number ?? "created"}.`
    );
    void load();
  }

  async function markPending(id: string) {
    setBusyId(id);
    setMessage(null);
    const response = await fetch(`/api/admin/applications/${id}/pending`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    setBusyId(null);
    if (!response.ok) {
      setMessage(data.error ?? "Update failed.");
      return;
    }
    setMessage("Application marked pending review.");
    void load();
  }

  async function reject(id: string) {
    const reason = window.prompt(
      "Rejection reason (shown to applicant):",
      "We could not verify your application at this time."
    );
    if (reason === null) return;

    setBusyId(id);
    setMessage(null);
    const response = await fetch(`/api/admin/applications/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await response.json();
    setBusyId(null);
    if (!response.ok) {
      setMessage(data.error ?? "Rejection failed.");
      return;
    }
    setMessage("Application rejected.");
    void load();
  }

  function formatKyc(app: Application) {
    const kyc = Array.isArray(app.kyc_verifications)
      ? app.kyc_verifications[0]
      : app.kyc_verifications;
    if (!kyc) return "Not submitted";
    return `SSN •••${kyc.ssn_last_four} · ${kyc.id_document_type.replace("_", " ")} •••${kyc.id_document_last_four} (${kyc.status})`;
  }

  function statusBadgeClass(status: string) {
    if (status === "draft") return "bg-white/10 text-white/70";
    if (status === "under_review") return "bg-amber-500/15 text-amber-200";
    return "bg-northium-gold/10 text-northium-gold";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">
          KYC & Membership Review
        </h1>
        <p className="mt-1 text-sm text-white/55">
          Review new applications, approve with or without KYC, mark pending, or
          reject.
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
              <TableHead className="text-white/60">Email</TableHead>
              <TableHead className="text-white/60">Accounts</TableHead>
              <TableHead className="text-white/60">KYC</TableHead>
              <TableHead className="text-white/60">Status</TableHead>
              <TableHead className="text-right text-white/60">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-white/50">
                  Loading applications...
                </TableCell>
              </TableRow>
            ) : applications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-white/50">
                  No pending applications.
                </TableCell>
              </TableRow>
            ) : (
              applications.map((app) => {
                const busy = busyId === app.id;
                const hasKyc = formatKyc(app) !== "Not submitted";
                return (
                  <TableRow key={app.id} className="border-white/10 text-white/85">
                    <TableCell className="font-medium">
                      {app.first_name} {app.last_name}
                    </TableCell>
                    <TableCell className="text-white/60">{app.email}</TableCell>
                    <TableCell className="text-xs capitalize text-white/60">
                      {(app.requested_account_types ?? ["checking"]).join(", ")}
                    </TableCell>
                    <TableCell className="max-w-xs text-xs text-white/60">
                      {formatKyc(app)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusBadgeClass(app.status)}>
                        {app.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={busy}
                          className="bg-northium-gold text-[#06121c] hover:bg-northium-gold/90"
                          onClick={() => void approve(app.id, true)}
                        >
                          Approve (KYC)
                        </Button>
                        <Button
                          size="sm"
                          disabled={busy}
                          variant="outline"
                          className="border-white/20 bg-transparent text-white hover:bg-white/5"
                          onClick={() => void approve(app.id, false)}
                        >
                          Approve (no KYC)
                        </Button>
                        <Button
                          size="sm"
                          disabled={busy || app.status === "under_review"}
                          variant="outline"
                          className="border-amber-500/30 bg-transparent text-amber-200 hover:bg-amber-500/10"
                          onClick={() => void markPending(app.id)}
                        >
                          Pending
                        </Button>
                        <Button
                          size="sm"
                          disabled={busy}
                          variant="outline"
                          className="border-red-500/30 bg-transparent text-red-200 hover:bg-red-500/10"
                          onClick={() => void reject(app.id)}
                        >
                          Reject
                        </Button>
                      </div>
                      {!hasKyc && (
                        <p className="mt-2 text-xs text-white/40">
                          No KYC yet — use Approve (no KYC) or wait for submission.
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
