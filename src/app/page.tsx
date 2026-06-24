import { Hero } from "@/components/marketing/hero";
import { MetricCards } from "@/components/marketing/metric-cards";
import { ProductGrid } from "@/components/marketing/product-grid";
import { FeatureCards } from "@/components/marketing/feature-cards";
import { SecuritySection } from "@/components/marketing/security-section";
import { PublicLayout } from "@/components/layout/public-layout";

export default function HomePage() {
  return (
    <PublicLayout>
      <Hero />
      <MetricCards />
      <ProductGrid />
      <FeatureCards />
      <SecuritySection />
    </PublicLayout>
  );
}
