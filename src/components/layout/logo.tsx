import Link from "next/link";
import { brand } from "@/lib/brand";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={className} aria-label={`${brand.name} home`}>
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-northium-gold">
          <span className="font-heading text-sm font-extrabold text-northium-primary">
            N
          </span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-heading text-base font-bold tracking-tight text-northium-primary">
            Northium
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-northium-muted">
            Credit Union
          </span>
        </div>
      </div>
    </Link>
  );
}
