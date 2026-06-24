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
        "grid grid-cols-2 gap-6 border-t border-white/15 pt-8 sm:grid-cols-4",
        className,
      )}
    >
      {heroStats.map((stat) => (
        <div key={stat.label} className="text-center lg:text-left">
          <dt className="text-xs uppercase tracking-wider text-white/55">
            {stat.label}
          </dt>
          <dd className="mt-1 font-heading text-lg font-bold text-northium-gold">
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
      <Container className="relative py-16 sm:py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-1.5 text-sm text-white/90 backdrop-blur-sm">
              <Shield className="size-4 text-northium-gold" />
              Member-owned · Institutionally governed
            </div>
            <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {brand.tagline}
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg lg:mx-0">
              Secure accounts, lending solutions and member-first banking for
              individuals and families.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
              <Button
                size="lg"
                className="h-12 w-full min-w-44 bg-northium-gold px-8 text-base font-semibold text-northium-primary hover:bg-northium-gold/90 sm:w-auto"
                render={<Link href="/apply" />}
              >
                Become A Member
                <ArrowRight className="ml-1 size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 w-full min-w-44 border-white/30 bg-white/10 px-8 text-base text-white backdrop-blur-sm hover:bg-white/20 sm:w-auto"
                render={<Link href="/sign-in" />}
              >
                Sign In
              </Button>
            </div>
            <HeroStats className="mt-12 hidden lg:grid lg:max-w-xl" />
          </div>
          <div className="relative mx-auto w-full max-w-md sm:max-w-lg lg:max-w-none">
            <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-2 shadow-2xl shadow-black/30 backdrop-blur-sm sm:p-3">
              <BankingImage
                visual="institutionHero"
                priority
                className="aspect-[4/3] w-full rounded-2xl lg:aspect-[16/10]"
                imageClassName="object-cover object-center scale-105"
                sizes="(max-width: 1024px) 90vw, 40vw"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rounded-2xl border border-northium-gold/40 bg-northium-secondary/95 px-5 py-4 shadow-xl backdrop-blur-sm sm:block">
              <p className="text-xs font-medium uppercase tracking-wider text-white/60">
                Protected by design
              </p>
              <p className="mt-1 font-heading text-sm font-semibold text-white">
                Institutional-grade security
              </p>
            </div>
          </div>
          <HeroStats className="mt-8 lg:hidden" />
        </div>
      </Container>
    </section>
  );
}
