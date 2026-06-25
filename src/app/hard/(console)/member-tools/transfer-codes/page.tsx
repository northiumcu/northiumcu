"use client";

import { MemberTransferCodesPanel } from "@/components/admin/member-transfer-codes-panel";
import { MemberToolPage } from "@/components/admin/member-tool-page";

export default function TransferCodesPage() {
  return (
    <MemberToolPage
      title="Transfer Security Codes"
      description="Require COT and IMF codes during outbound transfers for the selected member."
    >
      {(context) => (
        <MemberTransferCodesPanel
          selected={context.selected!}
          onUpdated={() => void context.load()}
        />
      )}
    </MemberToolPage>
  );
}
