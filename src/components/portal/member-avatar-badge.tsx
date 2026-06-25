"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function MemberAvatarBadge() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initials, setInitials] = useState("");

  useEffect(() => {
    void fetch("/api/member/profile")
      .then((r) => r.json())
      .then((data) => {
        const p = data.profile;
        if (!p) return;
        setAvatarUrl(p.avatar_url ?? null);
        setInitials(`${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`);
      });
  }, []);

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-northium-border bg-northium-surface/50 p-3">
      <div className="relative size-10 shrink-0 overflow-hidden rounded-full border border-northium-gold/40 bg-white">
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
        ) : (
          <span className="flex size-full items-center justify-center text-xs font-bold text-northium-primary">
            {initials || "?"}
          </span>
        )}
      </div>
      <p className="text-xs text-northium-muted">Signed in to your account</p>
    </div>
  );
}
