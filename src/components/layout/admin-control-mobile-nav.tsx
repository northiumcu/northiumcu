"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Shield } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { iconMap } from "@/components/layout/portal-sidebar";
import type { PortalNavItem } from "@/components/layout/portal-nav-shared";

interface AdminControlMobileNavProps {
  nav: readonly PortalNavItem[];
}

export function AdminControlMobileNav({ nav }: AdminControlMobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-white/10 bg-[#06121c] lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Shield className="size-5 text-northium-gold" />
          <span className="font-heading text-sm font-bold">Control System</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-2 text-white/70 hover:bg-white/5"
          aria-label="Toggle menu"
        >
          <Menu className="size-5" />
        </button>
      </div>
      {open && (
        <nav className="space-y-0.5 border-t border-white/10 p-2">
          {nav.map((item) => {
            const Icon = iconMap[item.icon];
            const isActive =
              pathname === item.href ||
              (item.href !== "/hard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  isActive
                    ? "bg-northium-gold text-[#06121c]"
                    : "text-white/70 hover:bg-white/5"
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
