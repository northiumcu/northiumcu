"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export function MemberPausedBanner() {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    void fetch("/api/member/status")
      .then((r) => r.json())
      .then((data) => setPaused(Boolean(data.paused)));
  }, []);

  if (!paused) return null;

  return (
    <div
      className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      role="status"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
      <div>
        <p className="font-semibold">Account paused</p>
        <p className="mt-1 text-amber-900/80">
          You can view your account, but transfers and profile changes are
          temporarily disabled. Contact your Northium account officer if you need
          assistance.
        </p>
      </div>
    </div>
  );
}
