import { MemberDashboardClient } from "@/components/portal/member-dashboard-client";
import { MemberKycPanel } from "@/components/portal/member-kyc-panel";
import { PortalPageHeader } from "@/components/layout/portal-page-header";

export default function MemberPage() {
  return (
    <>
      <PortalPageHeader
        title="Member Dashboard"
        description="Your accounts, activity, and quick actions in one place."
      />
      <div className="space-y-8">
        <MemberKycPanel />
        <MemberDashboardClient />
      </div>
    </>
  );
}
