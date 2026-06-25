"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminActionFeedback } from "@/components/admin/admin-action-feedback";
import {
  adminButtonDanger,
  adminButtonPrimary,
} from "@/components/admin/admin-button-styles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminCardRecord {
  id: string;
  product_name: string | null;
  cardholder_name: string | null;
  last_four: string;
  status: string;
  delivery_eta: string | null;
  application_fee_paid: boolean;
  created_at: string;
  member: {
    first_name: string;
    last_name: string;
    email: string;
    member_number: string | null;
  } | null;
}

export function AdminCardsPanel() {
  const [cards, setCards] = useState<AdminCardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [approvalNotes, setApprovalNotes] = useState<Record<string, string>>({});
  const [declineReasons, setDeclineReasons] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/admin/cards");
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setFeedback({
        type: "error",
        text: data.error ?? "Failed to load cards.",
      });
      return;
    }

    setCards(data.cards ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const pending = cards.filter((card) => card.status === "ordered");
  const issued = cards.filter((card) => card.status !== "ordered");

  async function review(id: string, decision: "approved" | "denied") {
    if (decision === "denied") {
      const reason = declineReasons[id]?.trim() ?? "";
      if (reason.length < 10) {
        setFeedback({
          type: "error",
          text: "Enter a decline reason (at least 10 characters) before denying.",
        });
        return;
      }
    }

    setBusyId(id);
    setFeedback(null);

    const note =
      decision === "denied"
        ? declineReasons[id]?.trim()
        : approvalNotes[id]?.trim() || undefined;

    const response = await fetch(`/api/admin/cards/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note }),
    });
    const data = await response.json();
    setBusyId(null);

    if (!response.ok) {
      setFeedback({ type: "error", text: data.error ?? "Card review failed." });
      return;
    }

    setFeedback({
      type: "success",
      text:
        decision === "approved"
          ? "Card approved. The member was emailed about production and mailing (7–30 days)."
          : "Card application denied. The member was emailed with your decline reason.",
    });
    void load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">Cards</h1>
        <p className="mt-1 text-sm text-white/55">
          Review Mastercard applications and issue digital card credentials.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f2233]">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Pending approval
          </p>
          <p className="mt-1 text-sm text-white/70">
            {loading
              ? "Loading applications..."
              : `${pending.length} application${pending.length === 1 ? "" : "s"} awaiting review`}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/60">Member</TableHead>
              <TableHead className="text-white/60">Card</TableHead>
              <TableHead className="text-white/60">Applied</TableHead>
              <TableHead className="text-white/60">Fee paid</TableHead>
              <TableHead className="text-right text-white/60">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-white/50">
                  Loading…
                </TableCell>
              </TableRow>
            ) : pending.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-white/50">
                  No pending card applications.
                </TableCell>
              </TableRow>
            ) : (
              pending.map((card) => (
                <TableRow key={card.id} className="border-white/10 text-white/85">
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {card.member
                          ? `${card.member.first_name} ${card.member.last_name}`
                          : "—"}
                      </p>
                      <p className="text-xs text-white/45">
                        {card.member?.email ?? "—"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p>{card.product_name ?? "Northium Mastercard"}</p>
                    <p className="text-xs text-white/45">{card.cardholder_name}</p>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(card.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{card.application_fee_paid ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex min-w-[15rem] flex-col items-end gap-3">
                      <div className="w-full space-y-1 text-left">
                        <Label className="text-[10px] uppercase tracking-wide text-white/45">
                          Optional approval note
                        </Label>
                        <Input
                          value={approvalNotes[card.id] ?? ""}
                          onChange={(e) =>
                            setApprovalNotes((current) => ({
                              ...current,
                              [card.id]: e.target.value,
                            }))
                          }
                          placeholder="Included in approval email"
                          className="h-8 rounded-lg border-white/15 bg-[#06121c] text-xs text-white"
                        />
                      </div>
                      <div className="w-full space-y-1 text-left">
                        <Label className="text-[10px] uppercase tracking-wide text-red-300/80">
                          Decline reason (required to deny)
                        </Label>
                        <Input
                          value={declineReasons[card.id] ?? ""}
                          onChange={(e) =>
                            setDeclineReasons((current) => ({
                              ...current,
                              [card.id]: e.target.value,
                            }))
                          }
                          placeholder="e.g. Incomplete identity verification on file"
                          className="h-8 rounded-lg border-white/15 bg-[#06121c] text-xs text-white"
                        />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          disabled={busyId === card.id}
                          className={adminButtonPrimary}
                          onClick={() => void review(card.id, "approved")}
                        >
                          Approve & Issue
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === card.id}
                          className={adminButtonDanger}
                          onClick={() => void review(card.id, "denied")}
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
        <AdminActionFeedback feedback={feedback} className="m-4" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f2233]">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
            Issued cards
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-transparent">
              <TableHead className="text-white/60">Member</TableHead>
              <TableHead className="text-white/60">Card</TableHead>
              <TableHead className="text-white/60">Last four</TableHead>
              <TableHead className="text-white/60">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issued.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-white/50">
                  No issued cards yet.
                </TableCell>
              </TableRow>
            ) : (
              issued.map((card) => (
                <TableRow key={card.id} className="border-white/10 text-white/85">
                  <TableCell>
                    {card.member
                      ? `${card.member.first_name} ${card.member.last_name}`
                      : "—"}
                  </TableCell>
                  <TableCell>{card.product_name ?? "Northium Mastercard"}</TableCell>
                  <TableCell>•••• {card.last_four}</TableCell>
                  <TableCell className="capitalize">
                    {card.status.replace(/_/g, " ")}
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
