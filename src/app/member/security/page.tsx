import { PortalPageHeader } from "@/components/layout/portal-page-header";
import { MemberSecurityClient } from "@/components/portal/member-security-client";

export default function MemberSecurityPage() {
  return (
    <div className="space-y-8">
      <PortalPageHeader
        visual="security"
        title="Security Center"
        description="Manage authentication, account protection, and security alerts."
      />
      <MemberSecurityClient />
    </div>
  );
}
