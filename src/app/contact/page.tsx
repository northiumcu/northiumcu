import Link from "next/link";
import { PublicLayout } from "@/components/layout/public-layout";
import { PageHeader } from "@/components/marketing/page-header";
import { ContentSection } from "@/components/marketing/content-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "@/components/contact/contact-form";
import {
  formatHeadquartersAddressMultiline,
  institution,
} from "@/lib/institution";

export default function ContactPage() {
  const addressLines = formatHeadquartersAddressMultiline();

  return (
    <PublicLayout>
      <PageHeader
        eyebrow="Contact"
        title="We Are Here To Help"
        description="Send us a message or reach member services directly."
        visual="support"
      />
      <ContentSection>
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-northium-border bg-northium-surface/40 p-6">
              <h2 className="font-heading text-lg font-semibold text-northium-primary">
                Member services
              </h2>
              <p className="mt-3">
                <a
                  href={`mailto:${institution.supportEmail}`}
                  className="font-medium text-northium-primary hover:underline"
                >
                  {institution.supportEmail}
                </a>
              </p>
              <p className="mt-4 text-sm text-northium-muted">
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <p className="mt-4 text-sm text-northium-muted">
                Signed-in members can use{" "}
                <Link
                  href="/member/support"
                  className="font-semibold text-northium-primary hover:underline"
                >
                  secure messaging
                </Link>
                . For fraud or suspicious activity, choose{" "}
                <strong>Security / fraud</strong> as the topic below.
              </p>
            </div>
          </div>

          <Card className="rounded-2xl border-northium-border shadow-sm lg:col-span-3">
            <CardHeader>
              <CardTitle className="font-heading text-xl text-northium-primary">
                Send a message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </ContentSection>
    </PublicLayout>
  );
}
