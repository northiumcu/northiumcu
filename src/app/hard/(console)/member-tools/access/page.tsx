"use client";

import { MemberAccessPanel } from "@/components/admin/member-access-panel";
import { MemberToolPage } from "@/components/admin/member-tool-page";

export default function MemberAccessPage() {
  return (
    <MemberToolPage
      title="Account Access"
      description="Pause, suspend, or restore a member's ability to sign in and use the portal."
    >
      {(context) => (
        <MemberAccessPanel selected={context.selected!} onUpdated={() => void context.load()} />
      )}
    </MemberToolPage>
  );
}
