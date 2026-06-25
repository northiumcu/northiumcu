"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AdminActionFeedback,
  type AdminFeedback,
} from "@/components/admin/admin-action-feedback";

interface EmailStatus {
  configured: boolean;
  source: string;
  from: string;
  defaultFromEmail: string;
  envVarPresent: boolean;
  databaseConfigured: boolean;
  storedFromEmail: string | null;
}

export function AdminEmailSettingsPanel() {
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [fromEmail, setFromEmail] = useState("helpdesk@northiumcu.com");
  const [testEmail, setTestEmail] = useState("");
  const [actionFeedback, setActionFeedback] = useState<AdminFeedback>(null);
  const [loadFeedback, setLoadFeedback] = useState<AdminFeedback>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/settings/email");
    const data = await response.json();
    if (response.ok) {
      setStatus(data);
      setFromEmail(data.storedFromEmail ?? data.defaultFromEmail ?? "helpdesk@northiumcu.com");
    } else {
      setLoadFeedback({ type: "error", text: data.error ?? "Failed to load email settings." });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(andTest = false) {
    setBusy(true);
    setActionFeedback(null);

    const response = await fetch("/api/admin/settings/email", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
        ...(fromEmail.trim() ? { fromEmail: fromEmail.trim() } : {}),
        ...(andTest && testEmail.trim() ? { testEmail: testEmail.trim() } : {}),
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setActionFeedback({ type: "error", text: data.error ?? "Save failed." });
      return;
    }

    setActionFeedback({ type: "success", text: data.message ?? "Saved." });
    setApiKey("");
    void load();
  }

  async function sendTest() {
    setBusy(true);
    setActionFeedback(null);

    const response = await fetch("/api/admin/settings/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        testEmail: testEmail.trim() || undefined,
      }),
    });
    const data = await response.json();
    setBusy(false);

    if (!response.ok) {
      setActionFeedback({ type: "error", text: data.error ?? "Test failed." });
      return;
    }

    setActionFeedback({ type: "success", text: data.message ?? "Test email sent." });
    void load();
  }

  return (
    <div className="space-y-4">
      {status && (
        <div className="rounded-xl border border-white/10 bg-[#06121c] px-4 py-3 text-sm text-white/70">
          <p>
            Status:{" "}
            <strong className={status.configured ? "text-northium-gold" : "text-red-300"}>
              {status.configured ? "Configured" : "Not configured"}
            </strong>
          </p>
          <p className="mt-1">
            Source: {status.source} · Vercel env: {status.envVarPresent ? "yes" : "no"} ·
            Database: {status.databaseConfigured ? "yes" : "no"}
          </p>
          <p className="mt-1">Sender: {status.from}</p>
        </div>
      )}

      <AdminActionFeedback feedback={loadFeedback} />

      <p className="text-sm text-white/55">
        If Vercel environment variables are not working, paste your Resend API key
        here. It is stored encrypted in the database. Verify{" "}
        <strong className="text-white/80">northiumcu.com</strong> in Resend and use{" "}
        <strong className="text-white/80">helpdesk@northiumcu.com</strong> as the sender.
      </p>

      <div className="space-y-2">
        <Label className="text-white/70">Resend API Key</Label>
        <Input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={status?.databaseConfigured ? "••••••••••••••••" : "re_..."}
          className="rounded-xl border-white/15 bg-[#06121c] text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white/70">Sender Email</Label>
        <Input
          type="email"
          value={fromEmail}
          onChange={(e) => setFromEmail(e.target.value)}
          className="rounded-xl border-white/15 bg-[#06121c] text-white"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-white/70">Test recipient</Label>
        <Input
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder="you@email.com"
          className="rounded-xl border-white/15 bg-[#06121c] text-white"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          disabled={busy || (!apiKey.trim() && !fromEmail.trim())}
          onClick={() => void save(false)}
          className="bg-northium-gold text-[#06121c] hover:bg-northium-gold/90"
        >
          Save Email Settings
        </Button>
        <Button
          disabled={busy}
          variant="outline"
          onClick={() => void save(true)}
          className="border-white/20 bg-transparent text-white hover:bg-white/5"
        >
          Save & Send Test
        </Button>
        <Button
          disabled={busy || !status?.configured}
          variant="outline"
          onClick={() => void sendTest()}
          className="border-white/20 bg-transparent text-white hover:bg-white/5"
        >
          Send Test Only
        </Button>
      </div>

      <AdminActionFeedback feedback={actionFeedback} />
    </div>
  );
}
