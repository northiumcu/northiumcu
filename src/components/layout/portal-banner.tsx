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
        "relative mb-6 overflow-hidden rounded-2xl border border-northium-border shadow-sm sm:mb-8",
        className
      )}
    >
      <BankingImage
        visual={visual}
        overlay="navy"
        className="absolute inset-0 min-h-[120px]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-northium-primary/95 via-northium-primary/80 to-northium-primary/50" />
      <div className="relative px-5 py-8 sm:px-8 sm:py-10">
        <h1 className="font-heading text-2xl font-bold text-white sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-white/75 sm:text-base">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
