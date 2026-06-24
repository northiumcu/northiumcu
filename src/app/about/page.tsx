import { PublicLayout } from "@/components/layout/public-layout";
import { CTASection, PageHeader } from "@/components/marketing/page-header";
import {
  ContentSection,
  InfoGrid,
} from "@/components/marketing/content-section";

const values = [
  {
    title: "Our Mission",
    description:
      "To provide secure, member-owned financial services that help individuals and families build lasting wealth across generations.",
  },
  {
    title: "Our Heritage",
    description:
      "Northium Credit Union serves communities with the same principles of trust, stability, and personal service across generations.",
  },
  {
    title: "Our Commitment",
    description:
      "Every decision we make is guided by what is best for our members — not shareholders. Your financial well-being is our sole priority.",
  },
  {
    title: "Our Promise",
    description:
      "Institutional-grade security, transparent pricing, and advisors who take the time to understand your goals.",
  },
] as const;

export default function AboutPage() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="About Northium"
        title="Generations Ahead."
        description="A member-owned financial institution built on trust, stability, and a commitment to serving families for the long term."
        visual="institution"
      />
      <ContentSection>
        <InfoGrid items={values} columns={2} />
      </ContentSection>
      <CTASection
        title="Join a financial institution that puts you first."
        description="Become a member-owner of Northium Credit Union and experience banking built on trust."
        visual="membership"
      />
    </PublicLayout>
  );
}
