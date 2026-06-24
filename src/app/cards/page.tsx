import { PublicLayout } from "@/components/layout/public-layout";
import { CTASection, PageHeader } from "@/components/marketing/page-header";
import {
  ContentSection,
  InfoGrid,
} from "@/components/marketing/content-section";

const cardTypes = [
  {
    title: "Northium Debit Card",
    description:
      "Included with every checking account. No annual fee, nationwide ATM access, and real-time fraud alerts.",
  },
  {
    title: "Rewards Visa",
    description:
      "Earn 1.5% cash back on all purchases. No annual fee, no foreign transaction fees, and competitive APR.",
  },
  {
    title: "Premium Visa Signature",
    description:
      "2% cash back on all purchases, travel insurance, purchase protection, and concierge services. $95 annual fee waived first year.",
  },
  {
    title: "Travel Rewards Visa",
    description:
      "3x points on travel and dining, 1x on everything else. No blackout dates, transfer partners, and TSA PreCheck credit.",
  },
] as const;

export default function CardsPage() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Cards"
        title="Cards Built For Responsible Spending"
        description="From everyday debit to premium rewards, Northium cards offer security, transparency, and member-focused benefits."
        visual="cards"
      />
      <ContentSection>
        <InfoGrid items={cardTypes} columns={2} />
      </ContentSection>
      <CTASection
        title="Apply for a Northium card today."
        description="Existing members can apply through the member portal. New members can include a card application with membership."
        primaryLabel="Apply For Membership"
        primaryHref="/apply"
        secondaryLabel="Member Sign In"
        secondaryHref="/sign-in"
      />
    </PublicLayout>
  );
}
