"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Profile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  member_number: string | null;
  avatar_url: string | null;
}

export function MemberProfileClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadProfile = useCallback(async () => {
    const response = await fetch("/api/member/profile");
    const data = await response.json();
    if (response.ok && data.profile) {
      setProfile(data.profile);
      setFirstName(data.profile.first_name);
      setLastName(data.profile.last_name);
      setPhone(data.profile.phone ?? "");
      setPaused(Boolean(data.paused));
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  async function uploadAvatar(file: File) {
    if (paused) {
      setError("Profile changes are disabled while your account is paused.");
      return;
    }
    if (file.size > 400_000) {
      setError("Image must be under 400KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const avatarUrl = reader.result as string;
      const response = await fetch("/api/member/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Upload failed.");
        return;
      }
      setMessage("Profile photo updated.");
      setError(null);
      setProfile((p) =>
        p ? { ...p, avatar_url: data.profile?.avatar_url ?? avatarUrl } : p
      );
    };
    reader.readAsDataURL(file);
  }

  async function saveDetails(event: React.FormEvent) {
    event.preventDefault();
    if (paused) {
      setError("Profile changes are disabled while your account is paused.");
      return;
    }
    setSaving(true);
    setMessage(null);
    setError(null);
    const response = await fetch("/api/member/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName,
        lastName,
        phone: phone.trim() || null,
      }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Save failed.");
      return;
    }
    setMessage("Profile updated.");
    if (data.profile) setProfile(data.profile);
  }

  if (!profile) {
    return <p className="text-sm text-northium-muted">Loading profile…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {paused && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Your account is paused. You can view your profile but cannot make changes
          until your account officer restores access.
        </div>
      )}

      <Card className="rounded-2xl border-northium-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-northium-primary">
            Your Photo
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative size-24 overflow-hidden rounded-full border-2 border-northium-gold bg-northium-surface">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Your profile"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex size-full items-center justify-center text-2xl font-bold text-northium-primary">
                {profile.first_name[0]}
                {profile.last_name[0]}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-northium-muted">
              Upload a photo so you recognize your account each time you sign in.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={paused}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadAvatar(file);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={paused}
              onClick={() => fileRef.current?.click()}
            >
              Upload Photo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-northium-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-northium-primary">
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveDetails} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  readOnly={paused}
                  className="rounded-xl bg-northium-surface"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  readOnly={paused}
                  className="rounded-xl bg-northium-surface"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile.email}
                readOnly
                className="rounded-xl bg-northium-surface"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                readOnly={paused}
                className="rounded-xl bg-northium-surface"
                placeholder="(555) 555-0100"
              />
            </div>
            <div className="space-y-2">
              <Label>Member Number</Label>
              <Input
                value={profile.member_number ?? "Pending approval"}
                readOnly
                className="rounded-xl bg-northium-surface"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-northium-success">{message}</p>}
            <Button
              type="submit"
              disabled={paused || saving}
              className="bg-northium-primary hover:bg-northium-secondary"
            >
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
