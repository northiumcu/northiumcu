"use client";

import { MemberPauseTransfersPanel } from "@/components/admin/member-pause-transfers-panel";
import { MemberToolPage } from "@/components/admin/member-tool-page";

export default function PauseTransfersPage() {
  return (
    <MemberToolPage
      title="Pause Transfers"
      description="Stop the next transfer during processing and show the member your custom message."
    >
      {(context) => (
        <MemberPauseTransfersPanel
          selected={context.selected!}
          onUpdated={() => void context.load()}
        />
      )}
    </MemberToolPage>
  );
}
