import Link from "next/link";
import { PublicLayout } from "@/components/layout/public-layout";
import { PageHeader } from "@/components/marketing/page-header";
import { ContentSection } from "@/components/marketing/content-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
        description="Reach our member services team by email or secure member messaging."
        visual="community"
      />
      <ContentSection>
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-8">
            <div>
              <h2 className="font-heading text-xl font-semibold text-northium-primary">
                Member Services
              </h2>
              <p className="mt-2">
                <a
                  href={`mailto:${institution.supportEmail}`}
                  className="font-medium text-northium-primary hover:underline"
                >
                  {institution.supportEmail}
                </a>
              </p>
              <p className="mt-2 text-sm text-northium-muted">
                For account support, membership applications, loans, and general
                inquiries.
              </p>
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold text-northium-primary">
                Headquarters
              </h2>
              <p className="mt-2 text-northium-muted">
                {addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </div>
            <div>
              <h2 className="font-heading text-xl font-semibold text-northium-primary">
                Security Concerns
              </h2>
              <p className="mt-2 text-sm text-northium-muted">
                Report fraud or suspicious activity immediately at{" "}
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
            <div>
              <h2 className="font-heading text-xl font-semibold text-northium-primary">
                Secure Messaging
              </h2>
              <p className="mt-2 text-sm text-northium-muted">
                Signed-in members can reach us through{" "}
                <Link
                  href="/member/support"
                  className="font-semibold text-northium-primary hover:underline"
                >
                  secure member messaging
                </Link>
                .
              </p>
            </div>
          </div>
          <Card className="rounded-2xl border-northium-border shadow-sm">
            <CardHeader>
              <CardTitle className="font-heading text-xl text-northium-primary">
                Send A Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" className="rounded-xl" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input id="subject" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    rows={4}
                    className="w-full rounded-xl border border-northium-border bg-white px-3 py-2 text-sm outline-none focus-visible:border-northium-primary focus-visible:ring-2 focus-visible:ring-northium-primary/20"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-northium-primary hover:bg-northium-secondary"
                >
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </ContentSection>
    </PublicLayout>
  );
}
