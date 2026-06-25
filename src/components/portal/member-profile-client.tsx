"use client";

import { useEffect, useRef, useState } from "react";
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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetch("/api/member/profile")
      .then((r) => r.json())
      .then((data) => setProfile(data.profile ?? null));
  }, []);

  async function uploadAvatar(file: File) {
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
      setProfile((p) => (p ? { ...p, avatar_url: data.avatarUrl } : p));
    };
    reader.readAsDataURL(file);
  }

  if (!profile) {
    return <p className="text-sm text-northium-muted">Loading profile…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
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
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadAvatar(file);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              Upload Photo
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {message && <p className="text-sm text-northium-success">{message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-northium-border shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg text-northium-primary">
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={profile.first_name} readOnly className="rounded-xl bg-northium-surface" />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={profile.last_name} readOnly className="rounded-xl bg-northium-surface" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={profile.email} readOnly className="rounded-xl bg-northium-surface" />
          </div>
          <div className="space-y-2">
            <Label>Member Number</Label>
            <Input
              value={profile.member_number ?? "Pending"}
              readOnly
              className="rounded-xl bg-northium-surface"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
