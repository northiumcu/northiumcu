import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

interface ContentSectionProps {
  children: React.ReactNode;
  className?: string;
}

export function ContentSection({ children, className }: ContentSectionProps) {
  return (
    <section className={cn("py-12 sm:py-16 lg:py-20", className)}>
      <Container>{children}</Container>
    </section>
  );
}

interface InfoGridProps {
  items: readonly { title: string; description: string }[];
  columns?: 2 | 3 | 4;
}

export function InfoGrid({ items, columns = 2 }: InfoGridProps) {
  const colClass = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  }[columns];

  return (
    <div className={cn("grid gap-5 sm:gap-6", colClass)}>
      {items.map((item) => (
        <div
          key={item.title}
          className="group rounded-2xl border border-northium-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8"
        >
          <div className="mb-4 h-1 w-10 rounded-full bg-northium-gold/60 transition-all group-hover:w-14 group-hover:bg-northium-gold" />
          <h3 className="font-heading text-lg font-semibold text-northium-primary">
            {item.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-northium-muted">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}
