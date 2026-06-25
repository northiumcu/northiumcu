"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StaffPasswordForm({ variant = "default" }: { variant?: "default" | "admin" }) {
  const isAdmin = variant === "admin";
  const inputClass = isAdmin
    ? "rounded-xl border-white/15 bg-[#06121c] text-white"
    : "rounded-xl";
  const mutedClass = isAdmin ? "text-white/45" : "text-northium-muted";
  const errorClass = isAdmin ? "text-red-300" : "text-red-600";
  const successClass = isAdmin ? "text-green-300" : "text-green-700";
  const buttonClass = isAdmin
    ? "bg-northium-gold text-[#06121c] hover:bg-northium-gold/90"
    : "bg-northium-primary hover:bg-northium-secondary";
  const labelClass = isAdmin ? "text-white/70" : undefined;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(typeof data.error === "string" ? data.error : "Update failed.");
      return;
    }

    setSuccess(data.message ?? "Password updated.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password" className={labelClass}>Current password</Label>
        <Input
          id="current-password"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClass}
          autoComplete="current-password"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password" className={labelClass}>New password</Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass}
          autoComplete="new-password"
          required
        />
        <p className={`text-xs ${mutedClass}`}>
          At least 12 characters with uppercase, lowercase, a number, and a
          symbol.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password" className={labelClass}>Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
          autoComplete="new-password"
          required
        />
      </div>
      {error && (
        <p className={`text-sm ${errorClass}`} role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className={`text-sm ${successClass}`} role="status">
          {success}
        </p>
      )}
      <Button
        type="submit"
        disabled={loading}
        className={buttonClass}
      >
        {loading ? "Updating..." : "Update password"}
      </Button>
    </form>
  );
}
