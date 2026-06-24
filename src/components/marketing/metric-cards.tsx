import { Container } from "@/components/layout/container";
import { trustPillars } from "@/lib/institution";

export function MetricCards() {
  return (
    <section className="border-b border-northium-border bg-white py-12 sm:py-16">
      <Container>
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {trustPillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-2xl border border-northium-border bg-gradient-to-b from-white to-northium-surface p-6 text-center shadow-sm sm:p-8"
            >
              <div className="mx-auto mb-4 h-1 w-8 rounded-full bg-northium-gold" />
              <p className="font-heading text-xl font-extrabold tracking-tight text-northium-primary sm:text-2xl">
                {pillar.title}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-northium-muted">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
