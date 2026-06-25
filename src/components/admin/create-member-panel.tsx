"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AccountType } from "@/lib/database/enums";
import {
  ELIGIBILITY_OPTIONS,
  PRIMARY_MEMBERSHIP_ACCOUNT_OPTIONS,
} from "@/lib/auth/membership-options";
import { PinInput } from "@/components/forms/pin-input";
import { formatUSPhoneInput } from "@/lib/format/phone";

interface CreateMemberPanelProps {
  onCreated?: () => void;
}

export function CreateMemberPanel({ onCreated }: CreateMemberPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    pin: "",
    confirmPin: "",
    eligibilityCategory: ELIGIBILITY_OPTIONS[0],
    requestedAccountType: "checking" as AccountType,
  });

  function updateField(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Failed to create member.");
      return;
    }

    const member = data.member as {
      firstName?: string;
      lastName?: string;
      username?: string;
      memberNumber?: string;
      accountTypes?: string[];
    };

    setSuccess(
      `${member.firstName ?? form.firstName} ${member.lastName ?? form.lastName} is active. ` +
        `Username: ${member.username ?? form.username}. ` +
        `Member number: ${member.memberNumber ?? "issued"}. ` +
        `Accounts: ${(member.accountTypes ?? ["checking", "savings"]).join(", ")}.`
    );
    setForm({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      pin: "",
      confirmPin: "",
      eligibilityCategory: ELIGIBILITY_OPTIONS[0],
      requestedAccountType: "checking",
    });
    onCreated?.();
  }

  return (
    <Card className="rounded-2xl border-white/10 bg-[#0f2233] text-white shadow-none">
      <CardHeader>
        <CardTitle className="font-heading text-lg text-white">Create Member</CardTitle>
        <p className="text-sm text-white/55">
          Provision a fully approved member with active accounts. They can sign in
          immediately with their username and PIN.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-firstName" className="text-white/80">
                First Name
              </Label>
              <Input
                id="create-firstName"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                className="rounded-xl border-white/15 bg-[#06121c] text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-lastName" className="text-white/80">
                Last Name
              </Label>
              <Input
                id="create-lastName"
                value={form.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                className="rounded-xl border-white/15 bg-[#06121c] text-white"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-username" className="text-white/80">
                Username
              </Label>
              <Input
                id="create-username"
                value={form.username}
                onChange={(e) => updateField("username", e.target.value)}
                className="rounded-xl border-white/15 bg-[#06121c] text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email" className="text-white/80">
                Email
              </Label>
              <Input
                id="create-email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="rounded-xl border-white/15 bg-[#06121c] text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="create-phone" className="text-white/80">
              Phone
            </Label>
            <Input
              id="create-phone"
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => updateField("phone", formatUSPhoneInput(e.target.value))}
              placeholder="(555) 555-0100"
              className="rounded-xl border-white/15 bg-[#06121c] text-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PinInput
              id="create-pin"
              label="Account PIN"
              value={form.pin}
              onChange={(value) => updateField("pin", value)}
              variant="compact"
              required
            />
            <PinInput
              id="create-confirmPin"
              label="Confirm PIN"
              value={form.confirmPin}
              onChange={(value) => updateField("confirmPin", value)}
              variant="compact"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="create-accountType" className="text-white/80">
                Primary account
              </Label>
              <select
                id="create-accountType"
                value={form.requestedAccountType}
                onChange={(e) => updateField("requestedAccountType", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#06121c] px-3 py-2 text-sm text-white"
              >
                {PRIMARY_MEMBERSHIP_ACCOUNT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-white/45">Savings is included automatically.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-eligibility" className="text-white/80">
                Eligibility
              </Label>
              <select
                id="create-eligibility"
                value={form.eligibilityCategory}
                onChange={(e) => updateField("eligibilityCategory", e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#06121c] px-3 py-2 text-sm text-white"
              >
                {ELIGIBILITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-300" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-xl border border-northium-gold/30 bg-northium-gold/10 px-3 py-2 text-sm text-northium-gold" role="status">
              {success}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="bg-northium-gold text-[#06121c] hover:bg-northium-gold/90"
          >
            {loading ? "Creating member..." : "Create & Approve Member"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
