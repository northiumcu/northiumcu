import { TransferFlow } from "@/components/portal/transfer-flow";
import { PortalPageHeader } from "@/components/layout/portal-page-header";

export default function MemberTransfersPage() {
  return (
    <div className="space-y-8">
      <PortalPageHeader
        visual="portal"
        title="Transfer Funds"
        description="Secure transfers with PIN authorization and instant confirmation."
      />
      <TransferFlow />
    </div>
  );
}
