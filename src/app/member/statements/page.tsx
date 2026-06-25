import { StatementsClient } from "@/components/portal/statements-client";
import { PortalPageHeader } from "@/components/layout/portal-page-header";

export default function MemberStatementsPage() {
  return (
    <div className="space-y-8">
      <PortalPageHeader
        visual="accounts"
        title="Statements"
        description="View activity and download professional PDF statements for any period."
      />
      <StatementsClient />
    </div>
  );
}
