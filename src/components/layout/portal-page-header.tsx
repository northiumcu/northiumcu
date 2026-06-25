import type { VisualKey } from "@/lib/brand/visuals";
import { PortalBanner } from "@/components/layout/portal-banner";
import { cn } from "@/lib/utils";

interface PortalPageHeaderProps {
  title: string;
  description?: string;
  visual?: VisualKey;
  className?: string;
}

export function PortalPageHeader({
  title,
  description,
  visual = "portal",
  className,
}: PortalPageHeaderProps) {
  return (
    <PortalBanner
      visual={visual}
      title={title}
      description={description}
      className={cn("mb-8", className)}
    />
  );
}
