import { Bell, Fingerprint, Lock, ShieldCheck } from "lucide-react";
import { Container } from "@/components/layout/container";
import { securityFeatures } from "@/lib/brand";
import { BankingImage } from "@/components/marketing/banking-image";

const icons = [ShieldCheck, Fingerprint, Lock, Bell];

export function SecuritySection() {
  return (
    <section className="relative overflow-hidden bg-northium-primary py-16 sm:py-20 lg:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(212,166,74,0.1)_0%,_transparent_55%)]" />
      <Container className="relative">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Security You Can Trust
            </h2>
            <p className="mt-4 text-base text-white/70 sm:text-lg">
              Your financial safety is our highest priority. Every account is
              protected by institutional-grade security.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {securityFeatures.map((feature, i) => {
                const Icon = icons[i] ?? ShieldCheck;
                return (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm sm:p-6"
                  >
                    <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl bg-northium-gold/15">
                      <Icon className="size-5 text-northium-gold" />
                    </div>
                    <h3 className="font-heading text-base font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="overflow-hidden rounded-3xl border border-white/15 shadow-2xl">
              <BankingImage
                visual="portal"
                className="aspect-[4/5] w-full sm:aspect-square"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
