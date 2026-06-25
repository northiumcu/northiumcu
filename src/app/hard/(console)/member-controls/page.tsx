"use client";

import { useState } from "react";
import { MemberControlsPanel } from "@/components/admin/member-controls-panel";
import { CreateMemberPanel } from "@/components/admin/create-member-panel";

export default function MemberControlsPage() {
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <div className="space-y-6">
      <CreateMemberPanel onCreated={() => setRefreshToken((value) => value + 1)} />
      <MemberControlsPanel refreshToken={refreshToken} />
    </div>
  );
}
