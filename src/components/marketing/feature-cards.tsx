import { Building2, HandCoins, Lock, Users } from "lucide-react";
import { Container } from "@/components/layout/container";
import { whyNorthium } from "@/lib/brand";
import { BankingImage } from "@/components/marketing/banking-image";

const icons = [HandCoins, Users, Lock, Building2];

export function FeatureCards() {
  return (
    <section className="py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-5 lg:gap-16">
          <div className="lg:col-span-2">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-northium-primary sm:text-4xl">
              Why Northium
            </h2>
            <p className="mt-4 text-base text-northium-muted sm:text-lg">
              We have protected wealth for generations. Member ownership means
              your interests always come first.
            </p>
            <div className="mt-8 overflow-hidden rounded-2xl border border-northium-border shadow-lg">
              <BankingImage
                visual="community"
                className="aspect-[4/3] w-full"
                sizes="(max-width: 1024px) 100vw, 35vw"
              />
            </div>
          </div>
          <div className="grid gap-5 sm:gap-6 lg:col-span-3">
            {whyNorthium.map((feature, i) => {
              const Icon = icons[i] ?? HandCoins;
              return (
                <div
                  key={feature.title}
                  className="flex gap-4 rounded-2xl border border-northium-border bg-white p-5 shadow-sm sm:gap-5 sm:p-6"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-northium-gold/15 to-northium-primary/5 sm:size-12">
                    <Icon className="size-5 text-northium-gold sm:size-6" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-semibold text-northium-primary sm:text-lg">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-northium-muted">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
