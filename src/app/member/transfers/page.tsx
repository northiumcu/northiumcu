import { Suspense } from "react";
import { TransferFlow } from "@/components/portal/transfer-flow";
import { PortalPageHeader } from "@/components/layout/portal-page-header";

export default function MemberTransfersPage() {
  return (
    <div className="space-y-8">
      <Suspense fallback={<p className="text-sm text-northium-muted">Loading transfer form...</p>}>
        <TransferFlow />
      </Suspense>
      <PortalPageHeader
        visual="portal"
        title="Transfer Funds"
        description="Secure transfers with PIN authorization and instant confirmation."
        className="mb-0"
      />
    </div>
  );
}
