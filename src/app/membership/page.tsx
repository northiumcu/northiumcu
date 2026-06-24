import Link from "next/link";
import { PublicLayout } from "@/components/layout/public-layout";
import { CTASection, PageHeader } from "@/components/marketing/page-header";
import {
  ContentSection,
  InfoGrid,
} from "@/components/marketing/content-section";

const eligibility = [
  {
    title: "Open National Membership",
    description:
      "Northium welcomes members nationwide. Anyone who meets our membership agreement may join.",
  },
  {
    title: "Geographic Eligibility",
    description:
      "Residents of qualifying counties in the Northeast region are eligible to join Northium Credit Union.",
  },
  {
    title: "Employment",
    description:
      "Employees and retirees of partner organizations and select employer groups.",
  },
  {
    title: "Family Membership",
    description:
      "Immediate family members of current Northium members are eligible to join.",
  },
  {
    title: "Community Organizations",
    description:
      "Members of affiliated community organizations and associations.",
  },
] as const;

const benefits = [
  {
    title: "Member Ownership",
    description:
      "You are an owner, not a customer. Profits are returned to members.",
  },
  {
    title: "Competitive Rates",
    description:
      "Better savings rates and lower loan rates than traditional banks.",
  },
  {
    title: "Low Fees",
    description: "No monthly maintenance fees on standard checking accounts.",
  },
  {
    title: "Personal Service",
    description: "Dedicated support through email and secure member messaging.",
  },
] as const;

const steps = [
  {
    title: "1. Apply Online",
    description: "Complete our secure membership application in minutes.",
  },
  {
    title: "2. Verify Identity",
    description: "Provide government-issued ID and proof of eligibility.",
  },
  {
    title: "3. Fund Your Account",
    description: "Make an initial deposit of $25 to activate membership.",
  },
  {
    title: "4. Start Banking",
    description: "Access your accounts, cards, and member portal immediately.",
  },
] as const;

export default function MembershipPage() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Membership"
        title="Become A Member-Owner"
        description="Join Northium Credit Union and become part of a financial institution that exists to serve you."
        visual="membership"
      />
      <ContentSection>
        <h2 className="mb-8 font-heading text-2xl font-bold text-northium-primary">
          Eligibility
        </h2>
        <InfoGrid items={eligibility} columns={2} />
      </ContentSection>
      <ContentSection className="bg-northium-surface">
        <h2 className="mb-8 font-heading text-2xl font-bold text-northium-primary">
          Member Benefits
        </h2>
        <InfoGrid items={benefits} columns={2} />
      </ContentSection>
      <ContentSection>
        <h2 className="mb-8 font-heading text-2xl font-bold text-northium-primary">
          Join Process
        </h2>
        <InfoGrid items={steps} columns={4} />
        <p className="mt-8 text-center text-northium-muted">
          Ready to begin?{" "}
          <Link
            href="/apply"
            className="font-semibold text-northium-primary underline-offset-4 hover:underline"
          >
            Start your application
          </Link>
        </p>
      </ContentSection>
      <CTASection
        title="Your membership starts with $25."
        description="Open your account today and become a member-owner of Northium Credit Union."
        primaryLabel="Apply Now"
        primaryHref="/apply"
        visual="application"
      />
    </PublicLayout>
  );
}
