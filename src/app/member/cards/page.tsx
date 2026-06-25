import { MemberCardsClient } from "@/components/portal/member-cards-client";

export default function MemberCardsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-northium-primary">
          Your Cards
        </h1>
        <p className="mt-1 text-northium-muted">
          Northium Mastercard and card security controls.
        </p>
      </div>
      <MemberCardsClient />
    </div>
  );
}
