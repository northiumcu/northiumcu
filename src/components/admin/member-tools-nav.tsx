"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { memberToolsNav } from "@/lib/admin/member-tools-nav";
import { cn } from "@/lib/utils";

export { memberToolsNav } from "@/lib/admin/member-tools-nav";

export function MemberToolsNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const memberQuery = searchParams.get("member");

  return (
    <nav
      aria-label="Member tools"
      className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {memberToolsNav.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/hard/member-tools" && pathname.startsWith(item.href));

        const href = memberQuery
          ? `${item.href}?member=${encodeURIComponent(memberQuery)}`
          : item.href;

        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              "shrink-0 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-northium-gold/40 bg-northium-gold/15 text-northium-gold"
                : "border-white/10 bg-[#0f2233] text-white/70 hover:border-white/20 hover:text-white"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
