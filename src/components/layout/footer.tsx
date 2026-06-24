import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { brand } from "@/lib/brand";
import { publicNav } from "@/lib/constants";
import {
  formatHeadquartersAddressMultiline,
  institution,
} from "@/lib/institution";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const addressLines = formatHeadquartersAddressMultiline();

  return (
    <footer className="relative overflow-hidden border-t border-northium-border bg-northium-primary text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(212,166,74,0.08)_0%,_transparent_50%)]" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#d4a64a 1px, transparent 1px), linear-gradient(90deg, #d4a64a 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <Container className="relative py-12 sm:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div className="space-y-6 sm:col-span-2 lg:col-span-1">
            <Logo className="[&_span]:text-white [&_.text-northium-muted]:text-white/60" />
            <p className="max-w-xs pt-4 text-sm leading-relaxed text-white/70">
              {brand.tagline} Member-owned financial services for individuals
              and families.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wider text-white/50">
              Products
            </h3>
            <ul className="space-y-2.5">
              {["Accounts", "Loans", "Cards", "Membership"].map((item) => (
                <li key={item}>
                  <Link
                    href={`/${item.toLowerCase()}`}
                    className="text-sm text-white/80 transition-colors hover:text-northium-gold"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wider text-white/50">
              Institution
            </h3>
            <ul className="space-y-2.5">
              {publicNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/80 transition-colors hover:text-northium-gold"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wider text-white/50">
              Member Services
            </h3>
            <ul className="space-y-2.5 text-sm text-white/80">
              <li>
                <a
                  href={`mailto:${institution.supportEmail}`}
                  className="transition-colors hover:text-northium-gold"
                >
                  {institution.supportEmail}
                </a>
              </li>
              <li className="leading-relaxed text-white/70">
                {addressLines.slice(1).join(", ")}
              </li>
              <li>
                <Link
                  href="/security"
                  className="transition-colors hover:text-northium-gold"
                >
                  Security Center
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-northium-gold"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} {institution.name}. {institution.tagline}
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {institution.legalPages.slice(0, 3).map((page) => (
              <Link
                key={page.slug}
                href={`/legal/${page.slug}`}
                className="transition-colors hover:text-white/80"
              >
                {page.title}
              </Link>
            ))}
            <Link href="/contact" className="hover:text-white/80">
              Contact
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
