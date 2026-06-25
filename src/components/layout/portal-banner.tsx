import { BankingImage } from "@/components/marketing/banking-image";
import type { VisualKey } from "@/lib/brand/visuals";
import { cn } from "@/lib/utils";

interface PortalBannerProps {
  visual?: VisualKey;
  title: string;
  description?: string;
  className?: string;
}

export function PortalBanner({
  visual = "portal",
  title,
  description,
  className,
}: PortalBannerProps) {
  return (
    <div
      className={cn(
        "relative mb-6 overflow-hidden rounded-2xl border border-white/20 shadow-xl shadow-northium-primary/15 sm:mb-8",
        className
      )}
    >
      <BankingImage
        visual={visual}
        overlay="navy"
        className="absolute inset-0 min-h-[140px]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-northium-primary/95 via-[#0f3454]/88 to-emerald-900/55" />
      <div className="pointer-events-none absolute -right-10 top-0 size-44 rounded-full bg-northium-gold/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 size-36 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="relative px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-3 inline-flex rounded-full border border-northium-gold/35 bg-northium-gold/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100">
          Member Portal
        </div>
        <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base">{description}</p>
        )}
      </div>
    </div>
  );
}
