import { MemberProfileClient } from "@/components/portal/member-profile-client";
import { PortalPageHeader } from "@/components/layout/portal-page-header";

export default function MemberProfilePage() {
  return (
    <div className="space-y-8">
      <PortalPageHeader
        title="Profile Settings"
        description="Personalize your account and manage your information."
      />
      <MemberProfileClient />
    </div>
  );
}
