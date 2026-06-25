"use client";

import { useState } from "react";
import { CreateMemberPanel } from "@/components/admin/create-member-panel";
import { MemberToolsLayoutShell } from "@/components/admin/member-tools-layout-shell";

export default function CreateMemberPage() {
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <MemberToolsLayoutShell>
      <div className="space-y-4">
        <div>
          <h2 className="font-heading text-xl font-semibold text-white">Create Member</h2>
          <p className="mt-1 text-sm text-white/55">
            Provision a fully approved member with active accounts. They can sign in
            immediately with their username and PIN.
          </p>
        </div>
        <CreateMemberPanel onCreated={() => setRefreshToken((value) => value + 1)} />
      </div>
    </MemberToolsLayoutShell>
  );
}
