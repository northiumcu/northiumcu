"use client";

import { MemberDelayTransfersPanel } from "@/components/admin/member-delay-transfers-panel";
import { MemberToolPage } from "@/components/admin/member-tool-page";

export default function DelayTransfersPage() {
  return (
    <MemberToolPage
      title="Delay Transfers"
      description="Route every transfer from this member to the admin review queue before funds are debited."
    >
      {(context) => (
        <MemberDelayTransfersPanel
          selected={context.selected!}
          onUpdated={() => void context.load()}
        />
      )}
    </MemberToolPage>
  );
}
