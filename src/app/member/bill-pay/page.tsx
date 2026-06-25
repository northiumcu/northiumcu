import { BillPayClient } from "@/components/portal/bill-pay-client";
import { PortalPageHeader } from "@/components/layout/portal-page-header";

export default function MemberBillPayPage() {
  return (
    <div className="space-y-8">
      <PortalPageHeader
        title="Bill Pay"
        description="Save payees and send secure bill payments from your Northium accounts."
      />
      <BillPayClient />
    </div>
  );
}
