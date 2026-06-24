import { PublicLayout } from "@/components/layout/public-layout";
import { PageHeader } from "@/components/marketing/page-header";
import {
  ContentSection,
  InfoGrid,
} from "@/components/marketing/content-section";
import { SecuritySection } from "@/components/marketing/security-section";
import { institution } from "@/lib/institution";

const tips = [
  {
    title: "Use Strong Passwords",
    description:
      "Create unique passwords for your Northium account. Never share credentials via email.",
  },
  {
    title: "Enable MFA",
    description:
      "Add multi-factor authentication for an additional layer of protection on every sign-in.",
  },
  {
    title: "Monitor Your Accounts",
    description:
      "Review transactions regularly and set up account alerts for unusual activity.",
  },
  {
    title: "Beware of Phishing",
    description:
      "Northium will never ask for your password, PIN, or full card number via email or text.",
  },
] as const;

export default function SecurityPage() {
  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Security"
        title="Your Security Is Our Priority"
        description="Institutional-grade protection for every account, transaction, and sign-in."
        visual="security"
      />
      <SecuritySection />
      <ContentSection>
        <h2 className="mb-8 font-heading text-2xl font-bold text-northium-primary">
          Safe Banking Tips
        </h2>
        <InfoGrid items={tips} columns={2} />
        <div className="mt-12 rounded-2xl border border-northium-border bg-northium-surface p-8">
          <h3 className="font-heading text-lg font-semibold text-northium-primary">
            Report Suspicious Activity
          </h3>
          <p className="mt-2 text-sm text-northium-muted">
            If you believe your account has been compromised, contact us
            immediately at{" "}
            <a
              href={`mailto:${institution.supportEmail}`}
              className="font-semibold text-northium-primary hover:underline"
            >
              {institution.supportEmail}
            </a>
            . Include &quot;Security&quot; in your subject line for priority
            handling.
          </p>
        </div>
      </ContentSection>
    </PublicLayout>
  );
}
