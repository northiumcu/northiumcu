import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { BankingImage } from "@/components/marketing/banking-image";
import type { VisualKey } from "@/lib/brand/visuals";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  visual?: VisualKey;
  variant?: "light" | "dark";
}

export function PageHeader({
  title,
  description,
  eyebrow,
  visual,
  variant = "light",
}: PageHeaderProps) {
  const isDark = variant === "dark";

  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-northium-border",
        isDark ? "bg-northium-primary" : "bg-northium-surface"
      )}
    >
      {!isDark && (
        <div className="absolute inset-0 bg-gradient-to-b from-white via-northium-surface/80 to-northium-surface" />
      )}
      <Container className="relative py-12 sm:py-16 lg:py-20">
        <div
          className={cn(
            "grid items-center gap-10",
            visual ? "lg:grid-cols-2 lg:gap-16" : ""
          )}
        >
          <div className={cn(visual && "order-2 lg:order-1")}>
            {eyebrow && (
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-northium-gold">
                {eyebrow}
              </p>
            )}
            <h1
              className={cn(
                "font-heading text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl",
                isDark ? "text-white" : "text-northium-primary"
              )}
            >
              {title}
            </h1>
            {description && (
              <p
                className={cn(
                  "mt-4 max-w-2xl text-base leading-relaxed sm:text-lg",
                  isDark ? "text-white/70" : "text-northium-muted"
                )}
              >
                {description}
              </p>
            )}
          </div>
          {visual && (
            <div className="order-1 lg:order-2">
              <div className="overflow-hidden rounded-2xl border border-northium-border bg-white shadow-xl shadow-northium-primary/10 sm:rounded-3xl">
                <BankingImage
                  visual={visual}
                  className="aspect-[5/4] w-full"
                  sizes="(max-width: 1024px) 100vw, 45vw"
                />
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}

interface CTASectionProps {
  title: string;
  description: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  visual?: VisualKey;
}

export function CTASection({
  title,
  description,
  primaryLabel = "Become A Member",
  primaryHref = "/apply",
  secondaryLabel,
  secondaryHref,
  visual = "membership",
}: CTASectionProps) {
  return (
    <section className="border-t border-northium-border bg-white py-16 sm:py-20">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-northium-primary shadow-xl">
          <BankingImage
            visual={visual}
            overlay="navy"
            className="absolute inset-0"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-northium-primary/95 to-northium-primary/70" />
          <div className="relative px-6 py-12 text-center sm:px-10 sm:py-16 lg:px-16">
            <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              {title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base text-white/80 sm:text-lg">
              {description}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="h-12 w-full bg-northium-gold px-8 text-base font-semibold text-northium-primary hover:bg-northium-gold/90 sm:w-auto"
                render={<Link href={primaryHref} />}
              >
                {primaryLabel}
              </Button>
              {secondaryLabel && secondaryHref && (
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 w-full border-white/30 bg-white/10 px-8 text-base text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto"
                  render={<Link href={secondaryHref} />}
                >
                  {secondaryLabel}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
