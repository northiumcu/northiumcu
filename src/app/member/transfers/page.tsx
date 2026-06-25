import { TransferFlow } from "@/components/portal/transfer-flow";

export default function MemberTransfersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-northium-primary">
          Transfer Funds
        </h1>
        <p className="mt-1 text-northium-muted">
          Secure transfers with PIN authorization and instant confirmation.
        </p>
      </div>
      <TransferFlow />
    </div>
  );
}
