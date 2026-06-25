import { cn } from "@/lib/utils";

interface PortalSectionTitleProps {
  title: string;
  className?: string;
}

export function PortalSectionTitle({ title, className }: PortalSectionTitleProps) {
  return (
    <div className={cn("mb-4 flex items-center gap-3", className)}>
      <div
        className="h-9 w-1.5 rounded-full bg-gradient-to-b from-northium-gold via-amber-400 to-orange-400 shadow-sm shadow-amber-400/30"
        aria-hidden
      />
      <h2 className="font-heading text-lg font-semibold tracking-tight text-northium-primary">
        {title}
      </h2>
    </div>
  );
}
