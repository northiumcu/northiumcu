import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { productImageAlts, productImages } from "@/lib/brand/images";
import { products } from "@/lib/brand";
import { BankingImageSrc } from "@/components/marketing/banking-image";

export function ProductGrid() {
  return (
    <section className="bg-northium-surface py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-northium-primary sm:text-4xl">
            Products Built For Members
          </h2>
          <p className="mt-4 text-base text-northium-muted sm:text-lg">
            Comprehensive financial solutions designed with your long-term
            prosperity in mind.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:mt-16 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {products.map((product, i) => {
            const imageSrc = productImages[i] ?? productImages[0];
            const imageAlt = productImageAlts[i] ?? product.title;
            return (
              <Link
                key={product.title}
                href={product.href}
                className="group overflow-hidden rounded-2xl border border-northium-border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-northium-gold/40 hover:shadow-lg"
              >
                <BankingImageSrc
                  src={imageSrc}
                  alt={imageAlt}
                  className="aspect-[16/10] w-full"
                  overlay="dark"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="p-6 sm:p-8">
                  <h3 className="font-heading text-xl font-semibold text-northium-primary">
                    {product.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-northium-muted">
                    {product.description}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-northium-gold">
                    Learn more{" "}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
