import { MemberDashboard } from "@/components/portal/member-dashboard";
import { MemberKycPanel } from "@/components/portal/member-kyc-panel";
import { PortalBanner } from "@/components/layout/portal-banner";

export default function MemberPage() {
  return (
    <>
      <PortalBanner
        visual="portal"
        title="Member Dashboard"
        description="Overview of your accounts and recent activity."
      />
      <div className="space-y-8">
        <MemberKycPanel />
        <MemberDashboard />
      </div>
    </>
  );
}
