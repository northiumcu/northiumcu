"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface KycRecord {
  id: string;
  status: string;
  ssn_last_four: string;
  id_document_type: string;
  id_document_last_four: string;
  reviewed_at: string | null;
}

export interface MembershipApplication {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  requested_account_types: string[] | null;
  kyc_verifications: KycRecord[] | KycRecord | null;
}

function getKyc(app: MembershipApplication): KycRecord | null {
  if (Array.isArray(app.kyc_verifications)) {
    return app.kyc_verifications[0] ?? null;
  }
  return app.kyc_verifications;
}

function formatIdType(value: string) {
  return value.replaceAll("_", " ");
}

function formatStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function formatSubmittedAt(value: string | null, fallback: string) {
  const source = value ?? fallback;
  return new Date(source).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "draft":
      return "border-white/15 bg-white/5 text-white/70";
    case "under_review":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    case "submitted":
      return "border-sky-500/30 bg-sky-500/10 text-sky-100";
    default:
      return "border-northium-gold/30 bg-northium-gold/10 text-northium-gold";
  }
}

const actionPrimary =
  "bg-northium-gold text-[#06121c] hover:bg-northium-gold/90 focus-visible:ring-2 focus-visible:ring-northium-gold/40 active:bg-northium-gold/80";
const actionNeutral =
  "border border-white/20 bg-[#06121c] text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/20 active:bg-white/15";
const actionWarning =
  "border border-amber-500/35 bg-amber-950/20 text-amber-100 hover:bg-amber-500/15 focus-visible:ring-2 focus-visible:ring-amber-500/30 active:bg-amber-500/25";
const actionDanger =
  "border border-red-500/35 bg-red-950/25 text-red-100 hover:bg-red-500/15 focus-visible:ring-2 focus-visible:ring-red-500/30 active:bg-red-500/25";

export function MembershipReviewQueue() {
  const [applications, setApplications] = useState<MembershipApplication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState(
    "We could not verify your application at this time."
  );
  const [showRejectForm, setShowRejectForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/applications");
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Failed to load applications.");
      return;
    }

    const list = (data.applications ?? []) as MembershipApplication[];
    setApplications(list);
    setSelectedId((current) => {
      if (current && list.some((app) => app.id === current)) return current;
      return list[0]?.id ?? null;
    });
    setError(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => applications.find((app) => app.id === selectedId) ?? null,
    [applications, selectedId]
  );

  const selectedKyc = selected ? getKyc(selected) : null;
  const hasKyc = Boolean(selectedKyc);

  useEffect(() => {
    setShowRejectForm(false);
    setRejectReason("We could not verify your application at this time.");
  }, [selectedId]);

  async function approve(id: string, requireKyc: boolean) {
    setBusyId(id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/applications/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requireKyc }),
    });
    const data = await response.json();
    setBusyId(null);

    if (!response.ok) {
      setError(data.error ?? "Approval failed.");
      return;
    }

    setMessage(
      `Approved${requireKyc ? " with KYC" : " without KYC"}. Account number ${data.account?.account_number ?? "issued"}.`
    );
    await load();
  }

  async function markPending(id: string) {
    setBusyId(id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/applications/${id}/pending`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await response.json();
    setBusyId(null);

    if (!response.ok) {
      setError(data.error ?? "Update failed.");
      return;
    }

    setMessage("Application marked pending review.");
    await load();
  }

  async function reject(id: string) {
    setBusyId(id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/applications/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason.trim() }),
    });
    const data = await response.json();
    setBusyId(null);

    if (!response.ok) {
      setError(data.error ?? "Rejection failed.");
      return;
    }

    setMessage("Application rejected and member notified.");
    setShowRejectForm(false);
    await load();
  }

  const busy = selected ? busyId === selected.id : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">
            KYC & Membership Review
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-white/55">
            Review pending applications, validate identity details, and issue
            membership decisions from a single workspace.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => void load()}
          className={cn(actionNeutral, "gap-2")}
        >
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          Refresh queue
        </Button>
      </div>

      {(message || error) && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            error
              ? "border-red-500/30 bg-red-500/10 text-red-100"
              : "border-northium-gold/30 bg-northium-gold/10 text-northium-gold"
          )}
          role={error ? "alert" : "status"}
        >
          {error ?? message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-white/10 bg-[#0b1824]">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              Review queue
            </p>
            <p className="mt-1 text-sm text-white/70">
              {loading
                ? "Loading applications..."
                : `${applications.length} pending application${applications.length === 1 ? "" : "s"}`}
            </p>
          </div>

          <div className="max-h-[70vh] space-y-2 overflow-y-auto p-3">
            {loading ? (
              <p className="px-2 py-6 text-sm text-white/50">Loading...</p>
            ) : applications.length === 0 ? (
              <p className="px-2 py-6 text-sm text-white/50">
                No pending applications in the queue.
              </p>
            ) : (
              applications.map((app) => {
                const kyc = getKyc(app);
                const isSelected = selectedId === app.id;
                return (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => setSelectedId(app.id)}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-northium-gold/40",
                      isSelected
                        ? "border-northium-gold/45 bg-[#152a3d] ring-1 ring-northium-gold/25"
                        : "border-white/10 bg-[#0f2233] hover:border-white/20 hover:bg-[#132636] active:bg-[#152a3d]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">
                          {app.first_name} {app.last_name}
                        </p>
                        <p className="truncate text-xs text-white/50">{app.email}</p>
                      </div>
                      <Badge className={cn("shrink-0 border", statusBadgeClass(app.status))}>
                        {formatStatusLabel(app.status)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-white/45">
                      {kyc
                        ? `KYC on file · ${formatStatusLabel(kyc.status)}`
                        : "KYC not submitted"}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0f2233]">
          {!selected ? (
            <div className="flex min-h-[320px] items-center justify-center px-6 py-12 text-sm text-white/50">
              Select an application from the queue to review.
            </div>
          ) : (
            <div className="flex min-h-[320px] flex-col">
              <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                      Application review
                    </p>
                    <h2 className="mt-1 font-heading text-xl font-semibold text-white">
                      {selected.first_name} {selected.last_name}
                    </h2>
                    <p className="mt-1 text-sm text-white/60">{selected.email}</p>
                  </div>
                  <Badge className={cn("border", statusBadgeClass(selected.status))}>
                    {formatStatusLabel(selected.status)}
                  </Badge>
                </div>
              </div>

              <div className="grid flex-1 gap-5 px-5 py-5 sm:grid-cols-2 sm:px-6">
                <div className="rounded-xl border border-white/10 bg-[#0b1824] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                    Applicant
                  </p>
                  <dl className="mt-3 space-y-3 text-sm">
                    <div>
                      <dt className="text-white/45">Phone</dt>
                      <dd className="text-white/85">{selected.phone ?? "Not provided"}</dd>
                    </div>
                    <div>
                      <dt className="text-white/45">Requested accounts</dt>
                      <dd className="capitalize text-white/85">
                        {(selected.requested_account_types ?? ["checking"]).join(", ")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-white/45">Submitted</dt>
                      <dd className="text-white/85">
                        {formatSubmittedAt(selected.submitted_at, selected.created_at)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0b1824] p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-northium-gold" />
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                      Identity verification
                    </p>
                  </div>

                  {selectedKyc ? (
                    <dl className="mt-3 space-y-3 text-sm">
                      <div>
                        <dt className="text-white/45">Social Security Number</dt>
                        <dd className="font-mono text-white/85">•••-••-{selectedKyc.ssn_last_four}</dd>
                      </div>
                      <div>
                        <dt className="text-white/45">Government ID</dt>
                        <dd className="capitalize text-white/85">
                          {formatIdType(selectedKyc.id_document_type)} · ••••
                          {selectedKyc.id_document_last_four}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-white/45">KYC status</dt>
                        <dd>
                          <Badge className={cn("border", statusBadgeClass(selectedKyc.status))}>
                            {formatStatusLabel(selectedKyc.status)}
                          </Badge>
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-3 text-sm text-white/55">
                      No identity documents submitted yet. You can approve without KYC
                      or wait for the member to complete verification.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-auto border-t border-white/10 px-5 py-4 sm:px-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                  Decision
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy || !hasKyc}
                    onClick={() => void approve(selected.id, true)}
                    className={actionPrimary}
                  >
                    <CheckCircle2 className="size-4" />
                    Approve with KYC
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => void approve(selected.id, false)}
                    className={actionNeutral}
                  >
                    Approve without KYC
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy || selected.status === "under_review"}
                    onClick={() => void markPending(selected.id)}
                    className={actionWarning}
                  >
                    <Clock3 className="size-4" />
                    Mark pending
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy}
                    onClick={() => setShowRejectForm((value) => !value)}
                    className={actionDanger}
                  >
                    <XCircle className="size-4" />
                    Reject
                  </Button>
                </div>

                {!hasKyc && (
                  <p className="mt-3 text-xs text-white/45">
                    Approve with KYC becomes available after the member submits identity
                    verification.
                  </p>
                )}

                {showRejectForm && (
                  <div className="mt-4 rounded-xl border border-red-500/25 bg-red-950/20 p-4">
                    <Label htmlFor="reject-reason" className="text-white/75">
                      Rejection reason (sent to member)
                    </Label>
                    <textarea
                      id="reject-reason"
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                      rows={3}
                      className="mt-2 w-full rounded-xl border border-red-500/20 bg-[#06121c] px-3 py-2 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-red-500/30"
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy || rejectReason.trim().length < 8}
                        onClick={() => void reject(selected.id)}
                        className={actionDanger}
                      >
                        Confirm rejection
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => setShowRejectForm(false)}
                        className={actionNeutral}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
