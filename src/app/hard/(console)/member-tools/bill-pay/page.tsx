"use client";

import { MemberBillPayPanel } from "@/components/admin/member-bill-pay-panel";
import { MemberToolPage } from "@/components/admin/member-tool-page";

export default function BillPayControlsPage() {
  return (
    <MemberToolPage
      title="Bill Pay Access"
      description="Enable or disable bill pay for the selected member."
    >
      {(context) => (
        <MemberBillPayPanel
          selected={context.selected!}
          onUpdated={() => void context.load()}
        />
      )}
    </MemberToolPage>
  );
}
