import { MemberCardsClient } from "@/components/portal/member-cards-client";
import { PortalPageHeader } from "@/components/layout/portal-page-header";

export default function MemberCardsPage() {
  return (
    <div className="space-y-8">
      <PortalPageHeader
        visual="cards"
        title="Your Cards"
        description="Northium Mastercard and card security controls."
      />
      <MemberCardsClient />
    </div>
  );
}
