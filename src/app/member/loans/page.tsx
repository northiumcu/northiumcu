import { MemberLoansClient } from "@/components/portal/member-loans-client";
import { PortalPageHeader } from "@/components/layout/portal-page-header";

export default function MemberLoansPage() {
  return (
    <div className="space-y-8">
      <PortalPageHeader
        visual="lending"
        title="Loans & Mortgages"
        description="View approved loans or apply for personal, auto, and mortgage financing."
      />
      <MemberLoansClient />
    </div>
  );
}
