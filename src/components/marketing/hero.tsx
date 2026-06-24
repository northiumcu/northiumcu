import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { brand } from "@/lib/brand";
import { BankingImage } from "@/components/marketing/banking-image";
import { cn } from "@/lib/utils";

const heroStats = [
  { label: "Member-owned", value: "100%" },
  { label: "Digital access", value: "24/7" },
  { label: "Security", value: "Institutional" },
  { label: "Support", value: "Dedicated" },
] as const;

function HeroStats({ className }: { className?: string }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-x-6 gap-y-5 border-t sm:grid-cols-4",
        className,
      )}
    >
      {heroStats.map((stat) => (
        <div key={stat.label} className="text-center lg:text-left">
          <dt className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/50">
            {stat.label}
          </dt>
          <dd className="mt-1 font-heading text-base font-bold leading-none text-northium-gold sm:text-lg">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-northium-primary">
      <BankingImage
        visual="hero"
        priority
        overlay="navy"
        sizes="100vw"
        className="absolute inset-0"
        imageClassName="scale-105 object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-northium-primary/95 via-northium-primary/85 to-northium-primary/40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,166,74,0.18)_0%,_transparent_55%)]" />
      <Container className="relative py-14 sm:py-20 lg:py-24">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-14">
          <div className="flex flex-col text-center lg:max-w-xl lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 self-center rounded-full border border-white/20 bg-black/20 px-3.5 py-1 text-[13px] text-white/90 backdrop-blur-sm lg:self-start">
              <Shield className="size-3.5 shrink-0 text-northium-gold" />
              Member-owned · Institutionally governed
            </div>

            <div className="space-y-4">
              <h1 className="font-heading font-extrabold tracking-tight text-white">
                <span className="block text-[2rem] leading-[1.1] sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
                  {brand.tagline}
                </span>
                <span className="mt-2 block text-xl font-semibold leading-snug text-northium-gold sm:text-2xl lg:mt-2.5 lg:text-[1.75rem]">
                  {brand.altTagline}
                </span>
              </h1>

              <p className="mx-auto max-w-md text-[15px] leading-6 text-white/75 sm:text-base sm:leading-7 lg:mx-0">
                <span className="block">Secure accounts and lending solutions.</span>
                <span className="mt-1 block">
                  Member-first banking for individuals and families.
                </span>
              </p>
            </div>

            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:gap-4 lg:justify-start">
              <Button
                size="lg"
                className="h-11 w-full min-w-40 bg-northium-gold px-7 text-[15px] font-semibold text-northium-primary hover:bg-northium-gold/90 sm:w-auto"
                render={<Link href="/apply" />}
              >
                Become A Member
                <ArrowRight className="ml-1 size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 w-full min-w-40 border-white/30 bg-white/10 px-7 text-[15px] text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto"
                render={<Link href="/sign-in" />}
              >
                Sign In
              </Button>
            </div>

            <HeroStats className="mt-9 hidden border-white/10 pt-7 lg:grid lg:max-w-xl" />
          </div>

          <div className="relative mx-auto w-full max-w-sm sm:max-w-md lg:mx-0 lg:max-w-none lg:justify-self-end">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/5 p-1.5 shadow-2xl shadow-black/25 backdrop-blur-sm sm:rounded-3xl sm:p-2">
              <BankingImage
                visual="institutionHero"
                priority
                className="aspect-[5/4] w-full rounded-xl sm:rounded-2xl lg:aspect-[16/10]"
                imageClassName="object-cover object-center"
                sizes="(max-width: 1024px) 88vw, 42vw"
              />
            </div>
            <div className="absolute -bottom-3 -left-3 hidden rounded-xl border border-northium-gold/35 bg-northium-secondary/95 px-4 py-3 shadow-lg backdrop-blur-sm sm:block lg:-bottom-4 lg:-left-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-white/55">
                Protected by design
              </p>
              <p className="mt-0.5 font-heading text-sm font-semibold leading-snug text-white">
                Institutional-grade security
              </p>
            </div>
          </div>

          <HeroStats className="col-span-full border-white/10 pt-6 lg:hidden" />
        </div>
      </Container>
    </section>
  );
}
